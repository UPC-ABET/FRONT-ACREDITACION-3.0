'use client'

/**
 * MY PORTFOLIO PAGE
 *
 * Migrado desde UPC-SA-2025-FRONTEND/src/pages/content/Portfolio/MyPortfolio.jsx
 *
 * Conserva 1:1 el comportamiento funcional:
 *   - Listado de carpetas / archivos (con filtrado por rutas permitidas)
 *   - Crear carpeta / crear archivo .txt
 *   - Copiar / Pegar
 *   - Renombrar
 *   - Mover
 *   - Eliminar
 *   - Descargar (archivos / carpetas / multiples como ZIP)
 *   - Subir archivos via drag-and-drop o input
 *   - Modal de roles (solo admin)
 *   - Visor de arbol
 *
 * UI adaptada a los shared/components/ui del frontend nuevo (Dialog, LoadingDialog,
 * WarningDialog, ErrorDialog, SuccessDialog) en vez de SwalAlert/ConfirmModal/etc.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  ArrowDownTrayIcon,
  BriefcaseIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  DocumentIcon,
  DocumentPlusIcon,
  FolderIcon,
  FolderPlusIcon,
  ListBulletIcon,
  PencilSquareIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import {
  Button,
  ConfirmDialog,
  ErrorDialog,
  LoadingDialog,
  SuccessDialog,
  WarningDialog,
} from '@/shared/components/ui'

import {
  ModalBriefCase,
  ModalFile,
  PortfolioBreadcrumbs,
  TreeViewerModal,
  type ModalBriefCaseType,
  type ModalBriefCaseEvent,
} from '../components'

import {
  apiGet,
} from '../services/portfolioApiClient'
import {
  checkTotalSize,
  copyDocument,
  createFolder,
  createTextFile,
  deleteDocument,
  downloadSelected,
  getDownloadUrl,
  getFilesByDirectory,
  moveDocument,
  renameDocument,
  uploadLargeFile,
} from '../services/s3Service'
import { getPortfolioSession } from '../services/portfolioSession'

import type { PortfolioFileItem, PortfolioRouteItem } from '../types'

interface DocumentosSeleccionados {
  size: number
  documentos: Record<number, { key: string; name: string }>
}

interface RoleRow {
  idRol: number
  isAssociated: boolean
}

interface MoveListItem {
  key: string
  name: string
}

const INITIAL_ROUTE: PortfolioRouteItem = { name: 'inicio portafolio', dir: '' }
const INITIAL_SELECTED: DocumentosSeleccionados = { size: 0, documentos: {} }
const MODALIDADES_SISTEMA = ['EPE', 'Pregrado', 'WASC']
const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024 // 4 GB

function formatBytes(bytes: number | undefined, decimals = 2): string {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

function dateFormat(dateString: string | Date | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return String(dateString)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
}

function rename(
  doccc: Record<string, boolean>,
  fileName: string,
  isFile: boolean
): string {
  let except = ''
  let validate = true
  let indice = 0

  if (!isFile) {
    const splitP = fileName.split('.')
    const extension = '.' + splitP[splitP.length - 1]
    const base = splitP.slice(0, splitP.length - 1).join('.')
    while (validate) {
      if (doccc[base + except + extension]) {
        indice++
        except = '(' + indice + ')'
      } else {
        except = base + except + extension
        validate = false
      }
    }
  } else {
    const files = fileName.slice(0, fileName.length - 1)
    while (validate) {
      if (doccc[files + except + '/']) {
        indice++
        except = '(' + indice + ')'
      } else {
        validate = false
      }
    }
  }
  return except
}

export function MyPortfolioPage() {
  const [router, setRouter] = useState<PortfolioRouteItem[]>([INITIAL_ROUTE])
  const [documentos, setDocumentos] = useState<PortfolioFileItem[]>([])
  const [documentosSeleccionados, setDocumentosSeleccionados] =
    useState<DocumentosSeleccionados>(INITIAL_SELECTED)
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState<
    { key: string; name: string } | null
  >(null)
  const [documentoCopiar, setDocumentoCopiar] = useState<
    Array<{ key: string; name: string }>
  >([])
  const [rowSelected, setRowSelected] = useState<number[]>([])
  const [dataTable, setDataTable] = useState<PortfolioFileItem[]>([])
  const [dataTableInit, setDataTableInit] = useState<PortfolioFileItem[]>([])
  const [searchValue, setSearchValue] = useState('')

  // dialogs
  const [loading, setLoading] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [typeProgress, setTypeProgress] = useState<'Download' | 'Load' | ''>('')
  const [confirmView, setConfirmView] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<{ title?: string; message: string } | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  // Modales
  const [modalType, setModalType] = useState<ModalBriefCaseType | 'mover' | null>(null)
  const [isTreeNodeOpen, setIsTreeNodeOpen] = useState(false)

  // Roles y rutas
  const [isAdmin, setIsAdmin] = useState(false)
  const [accesoTotal, setAccesoTotal] = useState(false)
  const [rutasPermitidas, setRutasPermitidas] = useState<string[]>([])

  // ───────── Carga inicial de roles + rutas (solo cliente) ─────────
  useEffect(() => {
    const session = getPortfolioSession()
    if (!session) return

    const userId = session.userId
    const school = session.school
    if (!userId || !school) return

    apiGet<RoleRow[]>(
      `/project-portfolios/listar-roles?idUsuario=${userId}&escuela=IAM&escuelaUsuario=${school}`
    )
      .then((data) => {
        const adminRole = (data ?? []).find(
          (r) => r.idRol === 2 && r.isAssociated === true
        )
        setIsAdmin(!!adminRole)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    const session = getPortfolioSession()
    if (!session) return

    const rutas = session.allowedRoutes
    const tieneTodasLasModalidades = MODALIDADES_SISTEMA.every((m) => rutas.includes(m))

    if (rutas.length === 1 && rutas[0] === '/') {
      setAccesoTotal(true)
      setRutasPermitidas([])
      setRouter([INITIAL_ROUTE])
    } else if (tieneTodasLasModalidades) {
      setAccesoTotal(true)
      setRutasPermitidas([])
      setRouter([INITIAL_ROUTE])
    } else if (rutas.length > 0) {
      setAccesoTotal(false)
      setRutasPermitidas(rutas)

      const partes = rutas.map((r) => r.split('/'))
      const mismaModalidad = partes.every((p) => p[0] === partes[0][0])
      const carreras = partes.map((p) => p[1]).filter(Boolean)
      const mismaCarrera =
        carreras.length > 0 && carreras.every((c) => c === carreras[0])
      const todasTienenAnio = partes.every((p) => p.length === 3)

      if (rutas.length === 1 && partes[0].length === 2) {
        setRouter([
          INITIAL_ROUTE,
          { name: partes[0][0], dir: partes[0][0] + '/' },
          { name: partes[0][1], dir: partes[0][0] + '/' + partes[0][1] + '/' },
        ])
      } else if (mismaModalidad && mismaCarrera && todasTienenAnio) {
        setRouter([
          INITIAL_ROUTE,
          { name: partes[0][0], dir: partes[0][0] + '/' },
          { name: partes[0][1], dir: partes[0][0] + '/' + partes[0][1] + '/' },
        ])
      } else if (mismaModalidad && carreras.length > 1) {
        setRouter([INITIAL_ROUTE, { name: partes[0][0], dir: partes[0][0] + '/' }])
      } else {
        setRouter([INITIAL_ROUTE])
      }
    } else {
      setAccesoTotal(false)
      setRutasPermitidas([])
      setRouter([INITIAL_ROUTE])
    }
  }, [])

  // ───────── Filtrado segun rutas permitidas ─────────
  const getCarpetasFiltradas = useCallback(
    async (dir: string): Promise<PortfolioFileItem[]> => {
      if (!accesoTotal && rutasPermitidas.length === 0) return []
      if (rutasPermitidas.length === 0) return getFilesByDirectory(dir)

      if (dir === '') {
        const carpetas = await getFilesByDirectory(dir)
        const modalidadesPermitidas = [
          ...new Set(rutasPermitidas.map((ruta) => ruta.split('/')[0])),
        ]
        return carpetas.filter((c) => modalidadesPermitidas.includes(c.name))
      }

      const nivel = dir.split('/').filter(Boolean).length

      if (nivel === 1) {
        const carpetas = await getFilesByDirectory(dir)
        const modalidad = dir.replace(/\/$/, '')
        if (rutasPermitidas.includes(modalidad)) return carpetas
        const carrerasPermitidas = rutasPermitidas
          .filter((r) => r.startsWith(modalidad + '/'))
          .map((r) => r.split('/')[1])
          .filter(Boolean)
        return carpetas.filter((c) => carrerasPermitidas.includes(c.name))
      }

      if (nivel === 2) {
        const carpetas = await getFilesByDirectory(dir)
        const [modalidad, carrera] = dir.replace(/\/$/, '').split('/')
        const aniosPermitidos = rutasPermitidas
          .filter((r) => {
            const partes = r.split('/')
            return partes[0] === modalidad && partes[1] === carrera && partes[2]
          })
          .map((r) => r.split('/')[2])
        if (aniosPermitidos.length > 0)
          return carpetas.filter((c) => aniosPermitidos.includes(c.name))
        return carpetas
      }

      const puedeVer = rutasPermitidas.some(
        (r) => dir.startsWith(r) || r.startsWith(dir)
      )
      if (!puedeVer) return []
      return getFilesByDirectory(dir)
    },
    [accesoTotal, rutasPermitidas]
  )

  // ───────── Recarga de directorio ─────────
  const recargarDirectorio = useCallback(
    async (dir: string) => {
      setSearchValue('')
      const directorios = await getCarpetasFiltradas(dir)
      setDocumentos(directorios)
      setDataTableInit(directorios)
      setDataTable(directorios)
      setLoading(false)
    },
    [getCarpetasFiltradas]
  )

  const clearData = useCallback(async () => {
    setLoading(true)
    setDocumentosSeleccionados(INITIAL_SELECTED)
    setDocumentoSeleccionado(null)
    setRowSelected([])
    const route = router[router.length - 1]
    await recargarDirectorio(route.dir)
  }, [router, recargarDirectorio])

  useEffect(() => {
    const last = router[router.length - 1]
    getCarpetasFiltradas(last.dir).then((folders) => {
      setDocumentos(folders)
      setDataTableInit(folders)
      setDataTable(folders)
    })
  }, [router, rutasPermitidas, getCarpetasFiltradas])

  // ───────── Acciones de toolbar ─────────
  const handleAddCarp = () => setModalType('create')
  const handleAddTxt = () => setModalType('createTxt')

  const btnCreateDocument = async (inputValue: string) => {
    if (!inputValue) return
    setLoading(true)
    const rutaFolder = router
      .slice(1)
      .map((r) => r.name)
      .join('/')
    try {
      await createFolder(inputValue, rutaFolder)
      await clearData()
      setConfirmView('Se creo la carpeta correctamente')
    } catch (err) {
      console.error('Error al agregar carpeta:', err)
      setError('Ocurrio un problema al crear la carpeta')
    } finally {
      setLoading(false)
    }
  }

  const btnCreateTxtDocument = async (inputValue: string) => {
    if (!inputValue) return
    setLoading(true)
    const rutaFolder = router
      .slice(1)
      .map((r) => r.name)
      .join('/')
    try {
      await createTextFile(inputValue, rutaFolder)
      await clearData()
      setConfirmView('Se creo el archivo de texto correctamente')
    } catch (err) {
      console.error('Error al agregar archivo de texto:', err)
      setError('Ocurrio un problema al crear el archivo')
    } finally {
      setLoading(false)
    }
  }

  const handleClickCopy = () => {
    const documentosCopiados: Array<{ key: string; name: string }> = []
    const updateDocumentos = documentos.map((doc) => {
      if (doc.active) documentosCopiados.push({ name: doc.name, key: doc.key })
      return { ...doc, active: false }
    })

    if (documentosCopiados.length > 0) {
      setDocumentos(updateDocumentos)
      setDocumentoCopiar(documentosCopiados)
      setRowSelected([])
      setConfirmView('Se copio el archivo')
    } else {
      setWarning({ message: 'Selecciona un archivo para copiar' })
    }
  }

  const handleClickPaste = async () => {
    if (documentoCopiar.length === 0) {
      setWarning({ message: 'Debe seleccionar un elemento para pegar' })
      return
    }
    setLoading(true)
    const doccc: Record<string, boolean> = {}
    documentos.forEach((doc) => (doccc[doc.key] = true))
    const dir = router[router.length - 1].dir

    const docCopyList: MoveListItem[] = []
    documentoCopiar.forEach((file) => {
      if (file.key[file.key.length - 1] === '/') {
        const rutaCambiar = dir + file.name + rename(doccc, dir + file.name + '/', true)
        const lastName = rutaCambiar.split('/').pop() ?? file.name
        docCopyList.push({ name: lastName, key: file.key })
      } else {
        const fileName = rename(doccc, dir + file.name, false)
        const splitP = fileName.split('/')
        docCopyList.push({ name: splitP[splitP.length - 1], key: file.key })
      }
    })

    const result = await copyDocument(docCopyList, dir)
    if (result) {
      await clearData()
      setDocumentoCopiar([])
      setDocumentoSeleccionado(null)
      setConfirmView('Se realizo la copia correctamente.')
    } else {
      setError('Ocurrio un problema al realizar la copia')
      setLoading(false)
    }
  }

  const handleClickSetMove = () => {
    if (documentosSeleccionados.size === 0) {
      setDocumentoSeleccionado(null)
      setWarning({ message: 'Debe seleccionar un elemento para mover' })
    } else {
      setModalType('mover')
    }
  }

  const handleClickDocumento = async (
    documento: { name: string; directorio?: boolean; esDirectorio?: boolean; dir: string },
    index?: number,
    pages?: PortfolioRouteItem[]
  ) => {
    const isDir = documento.directorio ?? documento.esDirectorio ?? false

    if (!isDir) {
      const ext = documento.name.split('.').pop()?.toLowerCase() ?? ''
      const url = await getDownloadUrl(documento.dir)
      if (ext === 'pdf') {
        const viewer = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
        window.open(viewer, '_blank')
        return
      }
      const officeExts = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'xlsm', 'pdf']
      if (officeExts.includes(ext)) {
        const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
        window.open(officeUrl, '_blank')
        return
      }
      window.open(url, '_blank')
      return
    }

    let newRouter: PortfolioRouteItem[]
    if (pages && index !== undefined) {
      newRouter = pages.slice(0, index + 1)
    } else if (index !== undefined) {
      newRouter = router.slice(0, index + 1)
    } else {
      newRouter = [...router, { name: documento.name, dir: documento.dir }]
    }

    const destinoDir = newRouter[newRouter.length - 1].dir.replace(/\/$/, '')
    const puedeNavegar =
      rutasPermitidas.length === 0 ||
      rutasPermitidas.some((r) => destinoDir.startsWith(r) || r.startsWith(destinoDir))
    if (!puedeNavegar) return

    setRouter(newRouter)
    setRowSelected([])
  }

  const handleCheckAll = () => {
    const allSelected = rowSelected.length === dataTable.length
    if (allSelected) {
      setRowSelected([])
      setDataTable((prev) => prev.map((d) => ({ ...d, active: false })))
      setDocumentos((prev) =>
        prev.map((d) =>
          dataTable.find((dd) => dd.id === d.id) ? { ...d, active: false } : d
        )
      )
      setDocumentosSeleccionados({ size: 0, documentos: {} })
    } else {
      setRowSelected(dataTable.map((_, idx) => idx))
      setDataTable((prev) => prev.map((d) => ({ ...d, active: true })))
      setDocumentos((prev) =>
        prev.map((d) =>
          dataTable.find((dd) => dd.id === d.id) ? { ...d, active: true } : d
        )
      )
      const nuevos: DocumentosSeleccionados = { size: dataTable.length, documentos: {} }
      dataTable.forEach((doc, idx) => {
        nuevos.documentos[idx] = { key: doc.key, name: doc.name }
      })
      setDocumentosSeleccionados(nuevos)
    }
  }

  const handleClickActive = (item: PortfolioFileItem, index: number) => {
    setRowSelected((prev) =>
      prev.includes(index) ? prev.filter((r) => r !== index) : [...prev, index]
    )
    setDocumentos((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, active: !doc.active } : doc))
    )
    const seleccionados = [...documentos]
    const active = !seleccionados[index].active
    const { key, name } = seleccionados[index]

    setDocumentosSeleccionados((prev) => {
      const next: DocumentosSeleccionados = {
        size: prev.size,
        documentos: { ...prev.documentos },
      }
      if (active) {
        next.documentos[next.size] = { key, name }
        next.size = next.size + 1
      } else {
        const docIndex = Object.keys(next.documentos).findIndex(
          (docKey) => next.documentos[Number(docKey)].key === key
        )
        if (docIndex !== -1) {
          delete next.documentos[docIndex]
          for (let i = docIndex + 1; i < next.size; i++) {
            next.documentos[i - 1] = next.documentos[i]
          }
          delete next.documentos[next.size - 1]
          next.size = next.size - 1
        }
      }
      return next
    })
    void item
  }

  const btnShowRename = () => {
    if (documentosSeleccionados.size !== 1) {
      setDocumentoSeleccionado(null)
      setWarning({ message: 'Debe seleccionar un elemento para renombrar' })
      return
    }
    Object.entries(documentosSeleccionados.documentos).forEach(([, value]) => {
      setDocumentoSeleccionado({ key: value.key, name: value.name })
    })
    setModalType('edit')
  }

  const btnRenameDocument = async (rname: { documentKey: string; newName: string }) => {
    if (!documentoSeleccionado) return
    setLoading(true)
    const isDir = documentoSeleccionado.key[documentoSeleccionado.key.length - 1] === '/'
    if (isDir) {
      if (documentoSeleccionado.name === rname.newName) {
        setLoading(false)
        return
      }
    } else {
      const dsname = documentoSeleccionado.name.split('.')
      const dsexte = dsname[dsname.length - 1]
      if (documentoSeleccionado.name === rname.newName + '.' + dsexte) {
        setLoading(false)
        return
      }
    }

    const doccc: Record<string, boolean> = {}
    documentos.forEach((doc) => (doccc[doc.key] = true))
    const isFile = rname.documentKey[rname.documentKey.length - 1] === '/'
    let newName = rname.newName

    if (isFile) {
      const fileName = router[router.length - 1].dir + newName
      const countFile = rename(doccc, fileName + '/', true)
      newName = newName + countFile
    }

    const result = await renameDocument(rname.documentKey, newName)
    if (result) {
      await clearData()
      setConfirmView('Se realizo el renombre correctamente.')
      setRowSelected([])
    } else {
      setError('Ocurrio un problema al realizar el renombre')
      setLoading(false)
    }
  }

  const handleDeleteClick = () => {
    const seleccionados = documentosSeleccionados.documentos
    const haveObjects = Object.values(seleccionados).some(
      (v) => typeof v === 'object' && v !== null
    )
    if (!haveObjects) {
      setWarning({ message: 'Debe seleccionar un elemento para eliminar' })
      return
    }
    setDeleteConfirmOpen(true)
  }

  const btnClickEliminarDocument = async () => {
    setLoading(true)
    const elements = Object.values(documentosSeleccionados.documentos).map((v) => ({
      name: v.name,
      key: v.key,
    }))
    const result = await deleteDocument(elements)
    if (result) {
      setDocumentoSeleccionado(null)
      setRowSelected([])
      await clearData()
      setConfirmView('Se elimino el archivo correctamente')
    } else {
      setLoading(false)
      setError('Ocurrio un problema al eliminar')
    }
  }

  const btnMoverDocument = async (
    listToMove: MoveListItem[],
    dirMove: string,
    directorios: PortfolioFileItem[]
  ) => {
    setLoading(true)
    const doccc: Record<string, boolean> = {}
    directorios.forEach((doc) => (doccc[doc.key] = true))
    const dir = dirMove

    const docMoveList: MoveListItem[] = []
    listToMove.forEach((file) => {
      if (file.key[file.key.length - 1] === '/') {
        const rutaCambiar = dir + file.name + rename(doccc, file.key, true)
        const lastName = rutaCambiar.split('/').pop() ?? file.name
        docMoveList.push({ name: lastName, key: file.key })
      } else {
        const fileName = rename(doccc, dir + file.name, false)
        const splitP = fileName.split('/')
        docMoveList.push({ name: splitP[splitP.length - 1], key: file.key })
      }
    })

    const result = await moveDocument(docMoveList, dirMove)
    if (result) {
      await clearData()
      setRowSelected([])
      setDocumentoSeleccionado(null)
      setConfirmView('Se movio correctamente')
    } else {
      setError('Ocurrio un problema al mover')
      setLoading(false)
    }
  }

  const handleEvent = (
    type: ModalBriefCaseEvent | 'mover',
    rname?: string | { documentKey: string; newName: string },
    listToMove?: MoveListItem[],
    dirMove?: string,
    directorios?: PortfolioFileItem[] | null
  ) => {
    setModalType(null)
    if (type === 'create') void btnCreateDocument(rname as string)
    else if (type === 'createTxt') void btnCreateTxtDocument(rname as string)
    else if (type === 'edit')
      void btnRenameDocument(rname as { documentKey: string; newName: string })
    else if (type === 'delete') void btnClickEliminarDocument()
    else if (type === 'mover' && listToMove && dirMove !== undefined && directorios) {
      void btnMoverDocument(listToMove, dirMove, directorios)
    }
  }

  // ───────── Descarga ─────────
  const handleDownloadClick = async () => {
    setTypeProgress('Download')
    setProgressOpen(true)
    setProgress(0)

    const selecteds = Object.values(documentosSeleccionados.documentos)
    if (selecteds.length === 0) {
      setProgressOpen(false)
      setWarning({ message: 'Debe seleccionar un elemento para descargar' })
      return
    }

    try {
      const keys = selecteds.map((d) => d.key)
      const sizeResult = await checkTotalSize(keys)
      if (sizeResult?.isLargerThan1GB) {
        setProgressOpen(false)
        setWarning({
          message: `La seleccion supera 1GB (${sizeResult.totalSizeInMB} MB). Reduzca la cantidad para poder descargar.`,
        })
        return
      }
    } catch {
      setProgressOpen(false)
      setError('Error al calcular el tamano total de los archivos seleccionados.')
      return
    }

    const sel = selecteds[0] as { key: string; name: string }
    const fullSel = documentos.find((d) => d.key === sel.key)
    const isDir =
      fullSel?.esDirectorio === true ||
      String(sel.key).endsWith('/')

    try {
      // Una sola carpeta -> ZIP
      if (selecteds.length === 1 && isDir && fullSel) {
        const result = await downloadSelected(
          [fullSel],
          setProgress,
          setEstimatedTime,
          fullSel.name
        )
        if (result?.blob instanceof Blob) {
          const blobUrl = URL.createObjectURL(result.blob)
          const a = document.createElement('a')
          const downloadName = result.name.toLowerCase().endsWith('.zip')
            ? result.name
            : `${result.name}.zip`
          a.href = blobUrl
          a.download = downloadName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(blobUrl)
        }
        await clearData()
        return
      }

      // Un solo archivo -> directo
      if (selecteds.length === 1) {
        const presigned = await getDownloadUrl(sel.key)
        const res = await fetch(presigned)
        const fileBlob = await res.blob()
        const blobUrl = URL.createObjectURL(fileBlob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = sel.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
        await clearData()
        return
      }

      // Multiples -> ZIP
      let currentFolderName = 'descarga'
      const parentFolders = selecteds.map((item) => {
        const parts = item.key.split('/').filter(Boolean)
        return parts.length > 1 ? parts[parts.length - 2] : ''
      })
      const allSame = parentFolders.every((f) => f === parentFolders[0])
      if (allSame && parentFolders[0]) currentFolderName = parentFolders[0]

      const fullItems = selecteds
        .map((s) => documentos.find((d) => d.key === s.key))
        .filter((d): d is PortfolioFileItem => !!d)

      const result = await downloadSelected(
        fullItems,
        setProgress,
        setEstimatedTime,
        currentFolderName
      )
      if (result?.blob instanceof Blob) {
        const blobUrl = URL.createObjectURL(result.blob)
        const a = document.createElement('a')
        const downloadName = result.name.toLowerCase().endsWith('.zip')
          ? result.name
          : `${result.name}.zip`
        a.href = blobUrl
        a.download = downloadName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
      }
      await clearData()
    } catch (err) {
      console.error('Error general en descarga:', err)
    } finally {
      setProgressOpen(false)
    }
  }

  // ───────── Drag and Drop / Upload ─────────
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length) {
        setWarning({ message: 'No se aceptan carpetas vacias.' })
        return
      }

      setTypeProgress('Load')
      setProgressOpen(true)

      const totalSize = acceptedFiles.reduce((sum, f) => sum + f.size, 0)
      let uploadedSize = 0
      const startTime = Date.now()
      const prefix = router[router.length - 1].dir.replace(/\/$/, '')

      try {
        for (const file of acceptedFiles) {
          const rawPath =
            (file as File & { webkitRelativePath?: string; path?: string })
              .webkitRelativePath ||
            (file as File & { path?: string }).path ||
            file.name
          const relPath = rawPath.replace(/^\/+/, '')
          const key = `${prefix}/${relPath}`
          await uploadLargeFile(file, key)

          uploadedSize += file.size
          const percent = totalSize > 0 ? Math.round((uploadedSize / totalSize) * 100) : 0
          setProgress(percent)

          const elapsedSec = (Date.now() - startTime) / 1000
          const speedBps = elapsedSec > 0 ? uploadedSize / elapsedSec : 0
          const remainB = totalSize - uploadedSize
          const etaSec = speedBps > 0 ? remainB / speedBps : 0
          setEstimatedTime(Math.round(etaSec))
        }

        await clearData()
      } catch (err) {
        console.error('Error en la subida:', err)
        setError('Error durante la subida de archivos')
      } finally {
        setProgressOpen(false)
        setProgress(0)
        setEstimatedTime(0)
      }
    },
    [router, clearData]
  )

  const getFilesFromEvent = useCallback(async (event: unknown) => {
    const erroresLectura: string[] = []
    const erroresTamano: string[] = []
    let files: File[] = []

    const evt = event as {
      target?: { files?: FileList }
      dataTransfer?: DataTransfer
    }

    if (evt.target?.files) {
      files = Array.from(evt.target.files).filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          erroresTamano.push(`${file.name} (${(file.size / 1024 ** 3).toFixed(2)} GB)`)
          return false
        }
        return true
      })
      if (erroresTamano.length > 0) {
        setWarning({
          message: `${erroresTamano.length} archivo(s) exceden el tamano maximo permitido de 4 GB.`,
        })
        return []
      }
      return files
    }

    const items = evt.dataTransfer?.items
    if (!items) return evt.dataTransfer ? Array.from(evt.dataTransfer.files) : []

    interface FsEntry {
      isFile: boolean
      isDirectory: boolean
      name: string
      file: (cb: (f: File) => void, err: () => void) => void
      createReader: () => { readEntries: (cb: (entries: FsEntry[]) => void, err: () => void) => void }
    }

    const traverse = async (entry: FsEntry, path = ''): Promise<File[]> =>
      new Promise((resolve) => {
        if (entry.isFile) {
          entry.file(
            (file) => {
              const tagged = file as File & { path?: string }
              tagged.path = path + file.name
              if (file.size > MAX_FILE_SIZE) {
                erroresTamano.push(
                  `${tagged.path} (${(file.size / 1024 ** 3).toFixed(2)} GB)`
                )
                resolve([])
              } else {
                resolve([file])
              }
            },
            () => {
              erroresLectura.push(path + entry.name)
              resolve([])
            }
          )
        } else if (entry.isDirectory) {
          const reader = entry.createReader()
          reader.readEntries(
            async (entries) => {
              let all: File[] = []
              for (const e of entries) {
                const result = await traverse(e, path + entry.name + '/')
                all = all.concat(result)
              }
              resolve(all)
            },
            () => {
              erroresLectura.push(path + entry.name + '/')
              resolve([])
            }
          )
        } else {
          resolve([])
        }
      })

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as DataTransferItem & {
        webkitGetAsEntry?: () => unknown
      }
      const entry = item.webkitGetAsEntry?.() as FsEntry | null | undefined
      if (!entry) continue
      const result = await traverse(entry)
      files = files.concat(result)
    }

    if (erroresTamano.length > 0) {
      setWarning({
        message: `${erroresTamano.length} archivo(s) exceden el tamano maximo permitido de 4 GB.`,
      })
      return []
    }
    if (erroresLectura.length > 0) {
      setWarning({
        message: `${erroresLectura.length} archivo(s) no se pudieron leer porque su ruta excede el limite permitido de 260 caracteres.`,
      })
      return []
    }
    return files
  }, [])

  const { getRootProps } = useDropzone({
    onDrop,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getFilesFromEvent: getFilesFromEvent as any,
  })

  // ───────── Busqueda ─────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    setSearchValue(text)
    if (text.trim() === '') setDataTable(dataTableInit)
    else
      setDataTable(
        dataTableInit.filter((item) =>
          item.name.toLowerCase().includes(text.toLowerCase())
        )
      )
  }

  const titleModal = useMemo(() => {
    if (modalType === 'create') return 'Crear Carpeta'
    if (modalType === 'createTxt') return 'Crear Comentario'
    if (modalType === 'edit') return 'Editar Archivo'
    if (modalType === 'delete') return 'Eliminar elemento'
    if (modalType === 'changeRole') return 'Gestionar accesos'
    return ''
  }, [modalType])

  const progressLabel =
    typeProgress === 'Download'
      ? `Descargando... ${progress}% (ETA: ${estimatedTime}s)`
      : typeProgress === 'Load'
        ? `Subiendo... ${progress}% (ETA: ${estimatedTime}s)`
        : 'Procesando...'

  return (
    <div className="px-0 bg-gray-100 mobile:px-6 desktop:px-8 shadow-lg rounded-lg">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-200">
        <BriefcaseIcon className="h-6 w-6 text-zinc-700" aria-hidden="true" />
        <h1 className="text-xl font-semibold text-zinc-900">Portafolio</h1>
      </div>

      <div className="px-4 mobile:px-6 desktop:px-8 pt-5 pb-20">
        <PortfolioBreadcrumbs
          pages={router}
          onHandleClickDocument={handleClickDocumento}
        />

        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => setIsTreeNodeOpen(true)}
            className="bg-red-600 hover:bg-red-500"
          >
            <ListBulletIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Rutas
          </Button>
          <Button variant="primary" onClick={handleAddCarp} className="bg-red-600 hover:bg-red-500">
            <FolderPlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Agregar
          </Button>
          <Button variant="primary" onClick={handleAddTxt} className="bg-red-600 hover:bg-red-500">
            <DocumentPlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Comentario
          </Button>
          <Button variant="primary" onClick={handleClickCopy} className="bg-red-600 hover:bg-red-500">
            <ClipboardDocumentIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Copiar
          </Button>
          <Button variant="primary" onClick={handleClickPaste} className="bg-red-600 hover:bg-red-500">
            <ClipboardDocumentIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Pegar
          </Button>
          <Button variant="primary" onClick={btnShowRename} className="bg-red-600 hover:bg-red-500">
            <PencilSquareIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Renombrar
          </Button>
          <Button variant="primary" onClick={handleClickSetMove} className="bg-red-600 hover:bg-red-500">
            <TruckIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Mover
          </Button>
          <Button variant="primary" onClick={handleDeleteClick} className="bg-red-600 hover:bg-red-500">
            <TrashIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Eliminar
          </Button>
          <Button variant="primary" onClick={handleDownloadClick} className="bg-red-600 hover:bg-red-500">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            Descargar
          </Button>
          {isAdmin && (
            <Button
              variant="primary"
              onClick={() => setModalType('changeRole')}
              className="bg-red-600 hover:bg-red-500"
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" aria-hidden="true" />
              Roles
            </Button>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <input
            type="text"
            onChange={handleSearchChange}
            value={searchValue}
            className="block w-full max-w-md rounded-md border-0 py-1.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-red-500 mobile:text-sm leading-6"
            placeholder="Buscar en Portafolio"
          />
        </div>

        <div className="mt-3 text-left text-sm font-semibold text-gray-900">
          VALORES SELECCIONADOS {documentosSeleccionados.size}
        </div>

        <div className="mt-2">
          <div
            {...getRootProps()}
            onClick={(e) => {
              e.stopPropagation()
              document.getElementById('customFileInput')?.click()
            }}
            className="border border-dashed border-gray-400 rounded-md p-4 text-center cursor-pointer hover:border-gray-600"
          >
            <input
              id="customFileInput"
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={async (event) => {
                const files = await getFilesFromEvent(event)
                void onDrop(files)
              }}
            />
            <p>Arrastra y suelta archivos o carpetas aqui, o haz clic para seleccionarlos</p>
          </div>
        </div>

        <div className="mt-6 flow-root">
          <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                    <button
                      type="button"
                      onClick={handleCheckAll}
                      className="bg-red-600 text-white text-xs font-semibold rounded px-2 py-1"
                    >
                      ALL
                    </button>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ultima modificacion
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tamano
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {dataTable.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-zinc-500">
                      No hay elementos.
                    </td>
                  </tr>
                )}
                {dataTable.map((doc, index) => (
                  <tr
                    key={`${doc.key}-${index}`}
                    className={rowSelected.includes(index) ? 'bg-red-50' : ''}
                  >
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={rowSelected.includes(index)}
                        onChange={() => handleClickActive(doc, index)}
                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleClickDocumento(
                            {
                              name: doc.name,
                              directorio: doc.esDirectorio,
                              esDirectorio: doc.esDirectorio,
                              dir: doc.key,
                            },
                            undefined
                          )
                        }
                        className="flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-red-600"
                      >
                        {doc.esDirectorio ? (
                          <FolderIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                        )}
                        <span>{doc.name}</span>
                      </button>
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-600">
                      {doc.ultimaModificacion === '-' || !doc.ultimaModificacion
                        ? '-'
                        : dateFormat(doc.ultimaModificacion)}
                    </td>
                    <td className="px-4 py-2 text-sm text-zinc-600">
                      {doc.esDirectorio ? '-' : formatBytes(doc.tamano)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialogs / Overlays */}
      <LoadingDialog isOpen={loading} />
      <LoadingDialog isOpen={progressOpen} label={progressLabel} />

      <WarningDialog
        isOpen={!!warning}
        onClose={() => setWarning(null)}
        title={warning?.title}
        message={warning?.message}
        onConfirm={() => setWarning(null)}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Eliminar"
        message="Esta accion eliminara el archivo o carpeta para siempre."
        onConfirm={async () => {
          setDeleteConfirmOpen(false)
          await btnClickEliminarDocument()
        }}
        onDecline={() => setDeleteConfirmOpen(false)}
      />

      <SuccessDialog
        isOpen={!!confirmView}
        onClose={() => setConfirmView(null)}
        title="Listo"
        message={confirmView ?? ''}
        onConfirm={() => setConfirmView(null)}
      />

      <ErrorDialog
        isOpen={!!error}
        onClose={() => setError(null)}
        title="Error"
        message={error ?? ''}
        onConfirm={() => setError(null)}
      />

      {/* Modal Brief case (create/createTxt/edit/changeRole) */}
      {modalType && modalType !== 'mover' && modalType !== 'delete' && (
        <ModalBriefCase
          title={titleModal}
          handleCloseModal={() => setModalType(null)}
          handleAction={null}
          itemData={documentoSeleccionado}
          typeModal={modalType}
          onHandleEvent={handleEvent}
        />
      )}

      {modalType === 'mover' && (
        <ModalFile
          routerPrev={router}
          docsMove={documentosSeleccionados}
          handleCloseModal={() => setModalType(null)}
          onHandleEvent={(type, rname, listToMove, dirMove, directorios) =>
            handleEvent(type, rname ?? undefined, listToMove, dirMove, directorios)
          }
        />
      )}

      <TreeViewerModal
        isOpen={isTreeNodeOpen}
        onClose={() => setIsTreeNodeOpen(false)}
      />
    </div>
  )
}

export default MyPortfolioPage
