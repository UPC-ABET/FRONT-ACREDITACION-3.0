'use client'

/**
 * S3 SERVICE
 *
 * Migrado 1:1 desde UPC-SA-2025-FRONTEND/src/pages/content/Portfolio/s3.js
 *
 * Estrategia (acordada con el usuario): paridad funcional 100% con el antiguo,
 * por lo que se mantiene el AWS SDK en cliente. Las credenciales se leen de
 * NEXT_PUBLIC_AWS_* (las variables son inseguras en produccion).
 *
 * Los uploads grandes y la consulta de tamano total siguen yendo al backend
 * NestJS (/s3/upload, /s3/size-total) tal como en el frontend antiguo.
 *
 * TODO (seguridad): Mover TODA la operacion S3 al backend NestJS y eliminar
 * las credenciales del cliente. El frontend solo deberia hablar con el backend.
 */

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import JSZip from 'jszip'

import { API_URL } from './portfolioApiClient'
import type { PortfolioFileItem, S3SizeResponse } from '../types'

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME ?? ''
const BUCKET_REGION = process.env.NEXT_PUBLIC_AWS_BUCKET_REGION ?? ''
const ACCESS_KEY_ID = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID ?? ''
const SECRET_ACCESS_KEY = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY ?? ''

/**
 * El S3Client se crea perezosamente para evitar fallos en SSR / build.
 */
let _client: S3Client | null = null
function getClient(): S3Client {
  if (_client) return _client
  if (!BUCKET_REGION) throw new Error('NEXT_PUBLIC_AWS_BUCKET_REGION no está definida en .env.local')
  if (!ACCESS_KEY_ID) throw new Error('NEXT_PUBLIC_AWS_ACCESS_KEY_ID no está definida en .env.local')
  if (!SECRET_ACCESS_KEY) throw new Error('NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY no está definida en .env.local')
  _client = new S3Client({
    region: BUCKET_REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  })
  return _client
}

const ActionType = {
  update: 'UPDATE',
  copy: 'COPY',
  delete: 'DELETE',
  rename: 'RENAME',
  move: 'MOVE',
} as const

type ActionTypeKey = (typeof ActionType)[keyof typeof ActionType]

const UNIQUE_TAG = '+UPC@2020/*1148I'

// ───────────────────────── PRIMITIVAS DE S3 ─────────────────────────

export async function createEmptyFolder(folderPath: string): Promise<void> {
  try {
    await getClient().send(
      new PutObjectCommand({ Bucket: BUCKET_NAME, Key: folderPath, Body: '' })
    )
  } catch (error) {
    console.error('Error al crear la carpeta vacia:', error)
    throw error
  }
}

export async function getFilesByDirectory(directory: string): Promise<PortfolioFileItem[]> {
  const command = new ListObjectsCommand({
    Bucket: BUCKET_NAME,
    Delimiter: '/',
    Prefix: directory ?? '',
  })

  const result = await getClient().send(command)
  const data: PortfolioFileItem[] = []
  let i = 0

  if (result.CommonPrefixes) {
    for (const value of result.CommonPrefixes) {
      i++
      const elements = (value.Prefix ?? '').split('/')
      const name = elements[elements.length - 2] ?? ''
      data.push({
        id: i,
        name,
        esDirectorio: true,
        key: value.Prefix ?? '',
        ultimaModificacion: '-',
        active: false,
      })
    }
  }

  if (result.Contents) {
    for (const value of result.Contents) {
      i++
      const elements = (value.Key ?? '').split('/')
      const name = elements[elements.length - 1] ?? ''
      data.push({
        id: i,
        name,
        esDirectorio: false,
        key: value.Key ?? '',
        ultimaModificacion: value.LastModified,
        tamano: value.Size,
        tag: value.ETag,
        active: false,
      })
    }
  }

  return data
}

export async function getDownloadUrl(key: string): Promise<string> {
  if (!key) throw new Error('No se proporciono un key valido para la descarga')
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
  return getSignedUrl(getClient(), command, { expiresIn: 3600 })
}

export async function getSizeFolders(directory: string): Promise<{
  size: number
  modified: Date | null
}> {
  const command = new ListObjectsCommand({
    Bucket: BUCKET_NAME,
    Delimiter: '/',
    Prefix: directory ?? '',
  })

  const result = await getClient().send(command)
  let folderSize = 0
  let latestModified: Date | null = null

  if (result.Contents) {
    for (const file of result.Contents) {
      folderSize += file.Size ?? 0
      if (file.LastModified) {
        const fileModified = new Date(file.LastModified)
        if (!latestModified || fileModified > latestModified) {
          latestModified = fileModified
        }
      }
    }
  }

  if (result.CommonPrefixes) {
    for (const prefix of result.CommonPrefixes) {
      const { size: subSize, modified: subModified } = await getSizeFolders(
        prefix.Prefix ?? ''
      )
      folderSize += subSize
      if (subModified && (!latestModified || subModified > latestModified)) {
        latestModified = subModified
      }
    }
  }

  return { size: folderSize, modified: latestModified }
}

// ──────────────────── RENAME / COPY / MOVE / DELETE ────────────────────

interface ActionItem {
  name: string
  key: string
}

export async function renameDocument(key: string, name: string): Promise<boolean> {
  return actionTypeDocument([{ name, key }], '', ActionType.rename)
}

export async function deleteDocument(stack: ActionItem[] = []): Promise<boolean> {
  return actionDeleteDocument(stack, '', ActionType.delete)
}

export async function copyDocument(stack: ActionItem[] = [], dir = ''): Promise<boolean> {
  return actionTypeDocument(stack, dir, ActionType.copy)
}

export async function moveDocument(stack: ActionItem[] = [], dir = ''): Promise<boolean> {
  return actionTypeDocument(stack, dir, ActionType.move)
}

function esDirectorio(dir: string): boolean {
  return dir[dir.length - 1] === '/'
}

function withoutPattern(chain: string): string {
  return chain.replace(/\(\d+\)/, '').trim()
}

function normalizeNewName(key: string, name: string): string {
  let suffix = ''
  if (key[key.length - 1] === '/') {
    suffix = '/'
  } else {
    const extension = key.split('.')
    if (extension.length === 1) return name
    suffix = '.' + extension[extension.length - 1]
  }
  return name + suffix
}

interface InternalResult {
  success: boolean
  result?: unknown
  error?: unknown
}

async function actionTypeDocument(
  stacks: ActionItem[] = [],
  dir = '',
  action: ActionTypeKey
): Promise<boolean> {
  const tempPromises: Promise<InternalResult>[] = []
  const client = getClient()

  // Trabajamos sobre copia para no mutar el array original al hacer pop.
  const workStack = [...stacks]

  while (workStack.length !== 0) {
    const stack = workStack.pop()!
    let { name } = stack
    const { key } = stack
    const isFolder = esDirectorio(key)

    name = normalizeNewName(key, name)
    const directory = key.split('/')
    let dirName: string

    if (directory[directory.length - 1] === '') {
      dirName = directory[directory.length - 2]
      dirName = key.replace(dirName + '/', '')
    } else {
      dirName = directory[directory.length - 1]
      dirName = key.replace(dirName, '')
    }

    if (isFolder) {
      const listCmd = new ListObjectsCommand({ Bucket: BUCKET_NAME, Prefix: key })
      const result = await client.send(listCmd)
      const folderName = name
      const splitKey = key.split('/')
      let sliceJoin = key
      if (splitKey.length > 3) {
        sliceJoin = splitKey.slice(0, -2).join('/') + '/'
      }

      if (result.Contents) {
        let path = ''
        for (const x of result.Contents) {
          let vkey = x.Key ?? ''
          const folderNameNormal = withoutPattern(folderName)
          let nname = ''

          if (action === ActionType.rename) {
            nname = dirName + vkey.replace(key, name).replace(UNIQUE_TAG, '')
          } else if (action === ActionType.copy || action === ActionType.move) {
            if (splitKey.length > 3) {
              vkey = vkey.replace(sliceJoin, '')
            }
            const index = vkey.lastIndexOf(folderNameNormal)
            if (index !== -1) {
              path = dir + vkey.substring(index).replace(folderNameNormal, folderName)
            } else {
              const nindex = vkey.lastIndexOf(folderName)
              if (nindex !== -1) path = dir + vkey.substring(nindex)
            }
          }

          if (
            action === ActionType.copy ||
            action === ActionType.rename ||
            action === ActionType.move
          ) {
            const commandCopy = new CopyObjectCommand({
              Bucket: BUCKET_NAME,
              CopySource: `/${BUCKET_NAME}/${encodeURIComponent(x.Key ?? '')}`,
              Key:
                action === ActionType.copy
                  ? path
                  : action === ActionType.rename
                    ? nname
                    : path,
            })
            tempPromises.push(
              client
                .send(commandCopy)
                .then((res) => ({ success: true, result: res }) as InternalResult)
                .catch((err) => ({ success: false, error: err }) as InternalResult)
            )
          }

          if (
            action === ActionType.delete ||
            action === ActionType.rename ||
            action === ActionType.move
          ) {
            const commandDelete = new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: x.Key ?? '',
            })
            tempPromises.push(
              client
                .send(commandDelete)
                .then((res) => ({ success: true, result: res }) as InternalResult)
                .catch((err) => ({ success: false, error: err }) as InternalResult)
            )
          }
        }
      }
    } else {
      let nname = ''
      if (action === ActionType.rename) nname = dirName + name
      else if (action === ActionType.copy || action === ActionType.move)
        nname = dir + stack.name

      if (
        action === ActionType.copy ||
        action === ActionType.rename ||
        action === ActionType.move
      ) {
        const commandCopy = new CopyObjectCommand({
          Bucket: BUCKET_NAME,
          CopySource: `/${BUCKET_NAME}/${encodeURIComponent(key)}`,
          Key: nname,
        })
        tempPromises.push(
          client
            .send(commandCopy)
            .then((res) => ({ success: true, result: res }) as InternalResult)
            .catch((err) => ({ success: false, error: err }) as InternalResult)
        )
      }

      if (
        action === ActionType.delete ||
        action === ActionType.rename ||
        action === ActionType.move
      ) {
        const commandDelete = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
        tempPromises.push(
          client
            .send(commandDelete)
            .then((res) => ({ success: true, result: res }) as InternalResult)
            .catch((err) => ({ success: false, error: err }) as InternalResult)
        )
      }
    }
  }

  const results = await Promise.all(tempPromises)
  return results.every((r) => r.success)
}

// ──────────────────── DELETE (batched) ────────────────────

async function deleteObject(key: string): Promise<InternalResult> {
  try {
    const response = await getClient().send(
      new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    )
    return { success: true, result: response }
  } catch (error) {
    console.error(`Error eliminando objeto ${key}:`, error)
    return { success: false, error }
  }
}

async function deleteMultipleObjects(keys: string[]): Promise<InternalResult> {
  try {
    const batchSize = 1000
    let allDeleted = true
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize)
      const response = await getClient().send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: {
            Objects: batch.map((k) => ({ Key: k })),
            Quiet: true,
          },
        })
      )
      if (response.$metadata.httpStatusCode !== 200) allDeleted = false
    }
    return { success: allDeleted }
  } catch (error) {
    console.error('Error eliminando objetos:', error)
    return { success: false, error }
  }
}

async function obtenerKeysDeCarpeta(keyCarpeta: string): Promise<string[]> {
  try {
    let keys: string[] = []
    let continuationToken: string | undefined
    do {
      const response = await getClient().send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: keyCarpeta.endsWith('/') ? keyCarpeta : keyCarpeta + '/',
          ContinuationToken: continuationToken,
        })
      )
      const batchKeys = response.Contents
        ? response.Contents.map((obj) => obj.Key ?? '')
        : []
      keys = keys.concat(batchKeys.filter((k) => k && k !== keyCarpeta))
      continuationToken = response.NextContinuationToken
    } while (continuationToken)
    return keys
  } catch (error) {
    console.error('Error al listar objetos de la carpeta:', error)
    return []
  }
}

async function actionDeleteDocument(
  stacks: ActionItem[] = [],
  dir = '',
  action: ActionTypeKey = ActionType.delete
): Promise<boolean> {
  const tempPromises: Promise<InternalResult>[] = []

  for (const stack of stacks) {
    const { key } = stack
    if (esDirectorio(key)) {
      const keysToDelete = await obtenerKeysDeCarpeta(key)
      if (keysToDelete.length > 0 && action === ActionType.delete) {
        tempPromises.push(deleteMultipleObjects(keysToDelete))
        tempPromises.push(deleteObject(key))
      }
      if (keysToDelete.length === 0 && action === ActionType.delete) {
        tempPromises.push(deleteObject(key))
      }
    } else if (action === ActionType.delete) {
      tempPromises.push(deleteMultipleObjects([key]))
    }
  }

  const results = await Promise.all(tempPromises)
  let allResolved = results.every((r) => r.success)

  if (action === ActionType.delete && dir && esDirectorio(dir)) {
    const deleteDirResult = await deleteObject(dir)
    allResolved = allResolved && deleteDirResult.success
  }

  return allResolved
}

// ──────────────────── UPLOAD ────────────────────

export async function uploadDocument(key: string, body: Blob | File): Promise<void> {
  try {
    const parallelUploads3 = new Upload({
      client: getClient(),
      params: { Bucket: BUCKET_NAME, Key: key, Body: body },
      tags: [],
      queueSize: 8,
      partSize: 500 * 1024 * 1024,
      leavePartsOnError: false,
    })
    parallelUploads3.on('httpUploadProgress', (progress) => {
      console.log(`Cargando: ${progress.loaded} de ${progress.total} bytes`)
    })
    await parallelUploads3.done()
  } catch (e) {
    console.error('Error en la carga del documento:', e)
  }
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

interface DownloadedFile {
  arrayBuffer: Uint8Array
  name: string
}

async function downloadDocument(selected: PortfolioFileItem): Promise<DownloadedFile | undefined> {
  try {
    const downloaded = await getClient().send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: selected.key })
    )
    const arrayBuffer = await downloaded.Body!.transformToByteArray()
    return { arrayBuffer, name: selected.key }
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
    const client = getClient()
    let ContinuationToken: string | undefined
    let isTruncated = true
    const allFiles: Array<{ Key: string; Size: number }> = []

    while (isTruncated) {
      const request = await client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          Prefix: selected.key,
          ContinuationToken,
        })
      )
      const filtered = (request.Contents ?? []).filter((obj) => obj.Key && !obj.Key.endsWith('/'))
      allFiles.push(
        ...filtered.map((f) => ({ Key: f.Key as string, Size: f.Size ?? 0 }))
      )
      isTruncated = request.IsTruncated ?? false
      ContinuationToken = request.NextContinuationToken
    }

    const totalBytes = allFiles.reduce((sum, f) => sum + f.Size, 0)
    let downloadedBytes = 0
    const startTime = Date.now()

    const downloadPromises = allFiles.map(async (file): Promise<DownloadedFile> => {
      const fileResponse = await client.send(
        new GetObjectCommand({ Bucket: BUCKET_NAME, Key: file.Key })
      )
      const arrayBuffer = await fileResponse.Body!.transformToByteArray()

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

async function folderExists(folderName: string, rutaFolder: string): Promise<boolean> {
  const nuevaRuta = rutaFolder !== '' ? rutaFolder + '/' + folderName : folderName
  const response = await getClient().send(
    new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: nuevaRuta,
      Delimiter: '/',
    })
  )
  return !!response.CommonPrefixes && response.CommonPrefixes.length > 0
}

async function getUniqueFolderName(folderName: string, rutaFolder: string): Promise<string> {
  let uniqueName = folderName
  let suffix = 1
  while (await folderExists(uniqueName, rutaFolder)) {
    uniqueName = `${folderName} (${suffix})`
    suffix++
  }
  return uniqueName
}

export async function createFolder(folderName: string, rutaFolder: string): Promise<void> {
  const uniqueName = await getUniqueFolderName(folderName, rutaFolder)
  const nuevaRuta = rutaFolder !== '' ? `${rutaFolder}/${uniqueName}` : uniqueName

  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${nuevaRuta}/`,
        Body: '',
        ContentType: 'application/x-directory',
      })
    )
  } catch (error) {
    console.error('Error creating folder:', error)
    throw new Error('Error creating folder')
  }
}

export async function createTextFile(fileName: string, rutaFolder: string): Promise<void> {
  const fullPath = rutaFolder ? `${rutaFolder}/${fileName}` : fileName
  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fullPath,
        Body: '',
        ContentType: 'text/plain',
      })
    )
  } catch (error) {
    console.error('Error al crear archivo .txt:', error)
    throw new Error('No se pudo crear el archivo .txt')
  }
}

// ──────────────────── LIST ALL KEYS ────────────────────

export async function listAllKeys(): Promise<string[]> {
  const keys: string[] = []
  let continuationToken: string | undefined
  do {
    const response = await getClient().send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      })
    )
    response.Contents?.forEach((obj) => {
      if (obj.Key) keys.push(obj.Key)
    })
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)
  return keys
}

// ──────────────── ENDPOINTS BACKEND (tamano + upload) ────────────────

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
