import JSZip from 'jszip'
import { API_URL } from './portfolioApiClient'
import type { PortfolioFileItem, S3SizeResponse } from '../types'

interface DownloadedFile {
  arrayBuffer: Uint8Array
  name: string
}

// ───────────────────────── PRIMITIVAS ─────────────────────────

export async function createEmptyFolder(folderPath: string): Promise<void> {
  const res = await fetch('/api/s3/create-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: folderPath, path: '' }),
  })
  if (!res.ok) throw new Error('Error al crear la carpeta vacia')
}

export async function getFilesByDirectory(directory: string): Promise<PortfolioFileItem[]> {
  const res = await fetch(`/api/s3/list?dir=${encodeURIComponent(directory)}`)
  if (!res.ok) throw new Error('Error al listar directorio')
  return res.json()
}

export async function getDownloadUrl(key: string): Promise<string> {
  if (!key) throw new Error('No se proporciono un key valido para la descarga')
  const res = await fetch(`/api/s3/presign?key=${encodeURIComponent(key)}&expires=3600`)
  if (!res.ok) throw new Error('Error al obtener URL de descarga')
  const { url } = await res.json()
  return url
}

export async function getSizeFolders(directory: string): Promise<{
  size: number
  modified: Date | null
}> {
  const res = await fetch(`/api/s3/size-folder?dir=${encodeURIComponent(directory)}`)
  if (!res.ok) throw new Error('Error al obtener tamano de carpeta')
  const data = await res.json()
  return {
    size: data.size,
    modified: data.modified ? new Date(data.modified) : null,
  }
}

// ──────────────────── RENAME / COPY / MOVE / DELETE ────────────────────

interface ActionItem {
  name: string
  key: string
}

export async function renameDocument(key: string, name: string): Promise<boolean> {
  const res = await fetch('/api/s3/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, name }),
  })
  if (!res.ok) return false
  const { ok } = await res.json()
  return ok
}

export async function deleteDocument(stack: ActionItem[] = []): Promise<boolean> {
  const res = await fetch('/api/s3/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stack }),
  })
  if (!res.ok) return false
  const { ok } = await res.json()
  return ok
}

export async function copyDocument(stack: ActionItem[] = [], dir = ''): Promise<boolean> {
  const res = await fetch('/api/s3/copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stack, dir }),
  })
  if (!res.ok) return false
  const { ok } = await res.json()
  return ok
}

export async function moveDocument(stack: ActionItem[] = [], dir = ''): Promise<boolean> {
  const res = await fetch('/api/s3/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stack, dir }),
  })
  if (!res.ok) return false
  const { ok } = await res.json()
  return ok
}

// ──────────────────── UPLOAD ────────────────────

export async function uploadDocument(key: string, body: Blob | File): Promise<void> {
  const res = await fetch(`/api/s3/upload?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    body,
  })
  if (!res.ok) throw new Error('Error en la carga del documento')
}

// ──────────────────── DOWNLOAD ────────────────────

function getRelativePath(fullPath: string, basePath: string): string {
  if (!fullPath.startsWith(basePath)) return fullPath
  let relative = fullPath.slice(basePath.length)
  if (relative.startsWith('/')) relative = relative.slice(1)
  if (!relative) {
    const parts = fullPath.split('/')
    relative = parts[parts.length - 1]
  }
  return relative
}

async function downloadDocument(selected: PortfolioFileItem): Promise<DownloadedFile | undefined> {
  try {
    const url = await getDownloadUrl(selected.key)
    const res = await fetch(url)
    if (!res.ok) throw new Error('Error descargando archivo')
    const buffer = await res.arrayBuffer()
    return { arrayBuffer: new Uint8Array(buffer), name: selected.key }
  } catch (error) {
    console.error('Error al descargar el documento:', error)
    return undefined
  }
}

async function downloadFolder(
  selected: PortfolioFileItem,
  onProgress?: (p: number) => void,
  setEstimatedTime?: (s: number) => void
): Promise<DownloadedFile[]> {
  try {
    const res = await fetch(`/api/s3/folder-keys?prefix=${encodeURIComponent(selected.key)}`)
    if (!res.ok) throw new Error('Error listando carpeta')
    const { files } = await res.json() as { files: { Key: string; Size: number }[] }

    const totalBytes = files.reduce((sum: number, f: { Size: number }) => sum + f.Size, 0)
    let downloadedBytes = 0
    const startTime = Date.now()

    const downloadPromises = files.map(async (file: { Key: string; Size: number }): Promise<DownloadedFile> => {
      const urlRes = await fetch(`/api/s3/presign?key=${encodeURIComponent(file.Key)}&expires=3600`)
      const { url } = await urlRes.json()
      const fileRes = await fetch(url)
      const buffer = await fileRes.arrayBuffer()
      const arrayBuffer = new Uint8Array(buffer)

      downloadedBytes += file.Size
      if (onProgress && totalBytes > 0) {
        onProgress(Math.round((downloadedBytes / totalBytes) * 100))
      }
      const elapsed = (Date.now() - startTime) / 1000
      if (setEstimatedTime && downloadedBytes > 0) {
        const eta = (elapsed * totalBytes) / downloadedBytes - elapsed
        setEstimatedTime(eta)
      }
      return { arrayBuffer, name: file.Key }
    })

    return Promise.all(downloadPromises)
  } catch (error) {
    console.error('Error al descargar la carpeta:', error)
    return []
  }
}

export async function downloadDocumentFile(
  selected: PortfolioFileItem,
  onProgress?: (p: number) => void,
  setEstimatedTime?: (s: number) => void
): Promise<DownloadedFile | DownloadedFile[] | undefined> {
  const isDir = selected.key[selected.key.length - 1] === '/'
  if (isDir) return downloadFolder(selected, onProgress, setEstimatedTime)
  return downloadDocument(selected)
}

export async function downloadSelected(
  stack: PortfolioFileItem[],
  onProgress?: (p: number) => void,
  setEstimatedTime?: (s: number) => void,
  currentFolderName = 'descarga'
): Promise<{ blob: Blob; name: string } | undefined> {
  if (stack.length === 0) return undefined

  const zip = new JSZip()

  const results = await Promise.all(
    stack.map(async (selected) => {
      try {
        return await downloadDocumentFile(selected, onProgress, setEstimatedTime)
      } catch (error) {
        console.error(`Error descargando ${selected.name}:`, error)
        return null
      }
    })
  )

  for (let i = 0; i < stack.length; i++) {
    const selected = stack[i]
    const result = results[i]
    if (!result) continue

    if (Array.isArray(result)) {
      result.forEach((item) => {
        const relativePath = getRelativePath(item.name, selected.key)
        if (relativePath && !relativePath.endsWith('/') && item.arrayBuffer) {
          zip.file(relativePath, item.arrayBuffer)
        }
      })
    } else if (result.arrayBuffer) {
      const relativePath = selected.esDirectorio
        ? getRelativePath(result.name, selected.key)
        : (selected.name ?? selected.key.split('/').pop() ?? '')
      if (relativePath && !relativePath.endsWith('/')) {
        zip.file(relativePath, result.arrayBuffer)
      }
    }
  }

  const zipContent = await zip.generateAsync({ type: 'uint8array' })
  const blob = new Blob([new Uint8Array(zipContent)], { type: 'application/zip' })
  return { blob, name: `${currentFolderName}.zip` }
}

// ──────────────────── CREATE FOLDER / TEXT FILE ────────────────────

export async function createFolder(folderName: string, rutaFolder: string): Promise<void> {
  const res = await fetch('/api/s3/create-folder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: folderName, path: rutaFolder }),
  })
  if (!res.ok) throw new Error('Error creating folder')
}

export async function createTextFile(fileName: string, rutaFolder: string): Promise<void> {
  const res = await fetch('/api/s3/create-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: fileName, path: rutaFolder }),
  })
  if (!res.ok) throw new Error('No se pudo crear el archivo .txt')
}

// ──────────────────── LIST ALL KEYS ────────────────────

export async function listAllKeys(): Promise<string[]> {
  const res = await fetch('/api/s3/keys')
  if (!res.ok) throw new Error('Error listando keys')
  const { keys } = await res.json()
  return keys
}

// ──────────────────── ENDPOINTS BACKEND (tamano + upload) ────────────────

export async function checkTotalSize(selected: unknown): Promise<S3SizeResponse | null> {
  try {
    const response = await fetch(`${API_URL}/s3/size-total`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(selected),
    })
    if (!response.ok) throw new Error('Error al consultar el tamano total')
    return (await response.json()) as S3SizeResponse
  } catch (err) {
    console.error('Error al calcular el tamano total:', err)
    return null
  }
}

export async function uploadLargeFile(file: File, key: string): Promise<void> {
  const form = new FormData()
  form.append('file', file)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2 * 60 * 60 * 1000)

  try {
    const res = await fetch(
      `${API_URL}/s3/upload?key=${encodeURIComponent(key)}`,
      {
        method: 'POST',
        body: form,
        signal: controller.signal,
      }
    )
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Upload error ${res.status}: ${errText}`)
    }
  } finally {
    clearTimeout(timeout)
  }
}
