'use client'

import { useCallback, useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  LoadingDialog,
  WarningDialog,
} from '@/shared/components/ui'
import {
  apiDelete,
  apiGet,
  apiPost,
} from '../services/portfolioApiClient'
import { ModalAccessRoutes } from './ModalAccessRoutes'

/**
 * Modal "BriefCase" (crear / editar / eliminar / changeRole) — migrado desde
 * ModalBriefCase.jsx. Mantiene los 4 typeModal originales.
 *
 * Endpoints (sin prefijo /api porque NEXT_PUBLIC_API_URL ya lo incluye):
 *   GET    /usuarios?escuela=IAM
 *   GET    /project-portfolios/listar-roles?...
 *   POST   /usuarios-roles/registrar-rol-usuario?...
 *   DELETE /usuarios-roles/eliminar-rol-usuario?...
 */

export type ModalBriefCaseType = 'create' | 'createTxt' | 'edit' | 'delete' | 'changeRole'

export type ModalBriefCaseEvent =
  | 'create'
  | 'createTxt'
  | 'edit'
  | 'delete'

interface ItemData {
  key: string
  name: string
}

interface ModalBriefCaseProps {
  title?: string | null
  itemData?: ItemData | null
  typeModal: ModalBriefCaseType
  handleCloseModal: () => void
  handleAction?: (() => void) | null
  onHandleEvent: (
    type: ModalBriefCaseEvent,
    rname?: string | { documentKey: string; newName: string }
  ) => void
}

interface RoleRow {
  idRol: number
  isAssociated: boolean
}

interface UsuarioBackend {
  idUsuario: number | string
  codigoDocente: string
  nombresDocente: string
  apellidosDocente: string
}

interface UsuarioConRol {
  idUsuario: number | string
  codigoDocente: string
  nombre: string
  apellidoDocente: string
  tieneRol15: boolean
}

const ESCUELAS = [
  'QA',
  'EISCB',
  'EISCC',
  'ESCEL',
  'INGAMB',
  'INGBIO',
  'INGCIV',
  'INGGMI',
  'INGGEM',
  'INGIND',
] as const

const INVALID_CHARS = ['\\', '/', ':', '*', '?', '"', '<', '>', '|']
const MAX_FOLDER_NAME_LENGTH = 255

export function ModalBriefCase({
  title,
  itemData,
  typeModal,
  handleCloseModal,
  onHandleEvent,
}: ModalBriefCaseProps) {
  const [inputRename, setInputRename] = useState('')
  const [documentKey, setDocumentKey] = useState('')
  const [loading, setLoading] = useState(false)

  // Warning dialog
  const [warningOpen, setWarningOpen] = useState(false)
  const [warningConfig, setWarningConfig] = useState<{
    title?: string
    message?: string
  }>({})

  // Change role state
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([])
  const [usuariosOriginal, setUsuariosOriginal] = useState<UsuarioConRol[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchUser, setSearchUser] = useState('')
  const [modalRoutesVisible, setModalRoutesVisible] = useState(false)
  const [usuarioActual, setUsuarioActual] = useState<UsuarioConRol | null>(null)

  const usersPerPage = 6

  // Solo se ejecuta en cliente, con guardia para evitar SSR errors.
  const [college, setCollege] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('escuela')
      if (!raw) return
      const parsed = JSON.parse(raw)
      setCollege(typeof parsed === 'string' ? parsed : String(parsed))
    } catch {
      // ignore
    }
  }, [])

  const reloadUsuarios = useCallback(async () => {
    if (!college) return
    setLoading(true)
    try {
      const usuariosBase = await apiGet<UsuarioBackend[]>('/usuarios?escuela=IAM')
      const usuariosConRol15 = await Promise.all(
        (usuariosBase ?? []).map(async (u) => {
          const roles = await apiGet<RoleRow[]>(
            `/project-portfolios/listar-roles?idUsuario=${u.idUsuario}&escuela=IAM&escuelaUsuario=${college}`
          )
          const tieneRol15 = (roles ?? []).some(
            (r) => r.idRol === 15 && r.isAssociated
          )
          return {
            idUsuario: u.idUsuario,
            codigoDocente: u.codigoDocente,
            nombre: u.nombresDocente,
            apellidoDocente: u.apellidosDocente,
            tieneRol15,
          }
        })
      )
      setUsuarios(usuariosConRol15)
      setUsuariosOriginal(usuariosConRol15.map((u) => ({ ...u })))
    } catch (error) {
      console.error('Error al recargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }, [college])

  useEffect(() => {
    if (typeModal === 'changeRole' && college) {
      void reloadUsuarios()
    }
  }, [typeModal, college, reloadUsuarios])

  useEffect(() => {
    if (typeModal === 'edit' && itemData) {
      setDocumentKey(itemData.key)
    }
  }, [typeModal, itemData])

  const validNewName = useCallback(
    (value: string) => {
      const hasInvalid = INVALID_CHARS.some((char) => value.includes(char))
      if (hasInvalid) {
        setLoading(false)
        setWarningConfig({
          title: 'Nombre invalido',
          message: 'El nombre de la carpeta contiene caracteres no validos: \\ / : * ? " < > |',
        })
        setWarningOpen(true)
        return false
      }
      if (value.length > MAX_FOLDER_NAME_LENGTH) {
        setLoading(false)
        setWarningConfig({
          title: 'Nombre invalido',
          message: `El tamano supera el maximo permitido ${MAX_FOLDER_NAME_LENGTH} caracteres`,
        })
        setWarningOpen(true)
        return false
      }
      return true
    },
    []
  )

  const handleCreate = useCallback(() => {
    if (validNewName(inputRename)) onHandleEvent('create', inputRename)
  }, [inputRename, onHandleEvent, validNewName])

  const handleCreateTxt = useCallback(() => {
    if (validNewName(inputRename)) onHandleEvent('createTxt', inputRename)
  }, [inputRename, onHandleEvent, validNewName])

  const handleEdit = useCallback(() => {
    if (validNewName(inputRename)) {
      onHandleEvent('edit', { documentKey, newName: inputRename })
    }
  }, [documentKey, inputRename, onHandleEvent, validNewName])

  const handleDelete = useCallback(() => {
    onHandleEvent('delete')
  }, [onHandleEvent])

  const handleToggleSwitch = useCallback((idUsuario: number | string) => {
    setUsuarios((prev) =>
      prev.map((u) =>
        u.idUsuario === idUsuario ? { ...u, tieneRol15: !u.tieneRol15 } : u
      )
    )
  }, [])

  const handleApplyRoleChanges = useCallback(async () => {
    setLoading(true)
    try {
      for (const usuario of usuarios) {
        const original = usuariosOriginal.find((u) => u.idUsuario === usuario.idUsuario)
        if (!original) continue

        if (!original.tieneRol15 && usuario.tieneRol15) {
          for (const escuela of ESCUELAS) {
            try {
              await apiPost(
                `/usuarios-roles/registrar-rol-usuario?escuela=IAM&idUsuario=${usuario.idUsuario}&idRol=15&escuelaUsuario=${escuela}`
              )
            } catch (err) {
              console.error(`POST fallido para ${escuela}:`, err)
            }
          }
        }
        if (original.tieneRol15 && !usuario.tieneRol15) {
          for (const escuela of ESCUELAS) {
            try {
              await apiDelete(
                `/usuarios-roles/eliminar-rol-usuario?escuela=IAM&idUsuario=${usuario.idUsuario}&idRol=15&escuelaUsuario=${escuela}`
              )
            } catch (err) {
              console.error(`DELETE fallido para ${escuela}:`, err)
            }
          }
        }
      }
      await reloadUsuarios()
      handleCloseModal()
    } finally {
      setLoading(false)
    }
  }, [usuarios, usuariosOriginal, reloadUsuarios, handleCloseModal])

  const handleOpenRoutesModal = (usuario: UsuarioConRol) => {
    setUsuarioActual(usuario)
    setModalRoutesVisible(true)
  }

  const filteredUsers = usuarios.filter(
    (u) =>
      `${u.apellidoDocente} ${u.nombre}`
        .toLowerCase()
        .includes(searchUser.toLowerCase()) ||
      u.codigoDocente.toLowerCase().includes(searchUser.toLowerCase())
  )

  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage))

  const renderActionButton = () => {
    if (typeModal === 'changeRole') return null
    const buttonText =
      typeModal === 'create' || typeModal === 'createTxt'
        ? 'Crear'
        : typeModal === 'edit'
          ? 'Guardar'
          : 'Confirmar'

    const onClickHandler =
      typeModal === 'create'
        ? handleCreate
        : typeModal === 'createTxt'
          ? handleCreateTxt
          : typeModal === 'edit'
            ? handleEdit
            : handleDelete

    return (
      <Button onClick={onClickHandler} variant="primary">
        {buttonText}
      </Button>
    )
  }

  return (
    <>
      <LoadingDialog isOpen={loading} />

      {modalRoutesVisible && (
        <ModalAccessRoutes
          isOpen={modalRoutesVisible}
          onClose={() => setModalRoutesVisible(false)}
          usuario={
            usuarioActual
              ? {
                  idUsuario: usuarioActual.idUsuario,
                  codigoDocente: usuarioActual.codigoDocente,
                  nombre: usuarioActual.nombre,
                }
              : null
          }
        />
      )}

      <Dialog open onOpenChange={(open) => { if (!open) handleCloseModal() }}>
        <DialogContent
          className={typeModal === 'changeRole' ? 'max-w-3xl' : 'max-w-lg'}
          showCloseButton={false}
        >
          <div className="flex items-start justify-between mb-2">
            <DialogTitle className="text-lg text-center leading-6 font-semibold flex-1">
              {title ?? ''}
            </DialogTitle>
            <button
              type="button"
              className="rounded-md bg-white text-gray-900 hover:text-gray-500 hover:bg-gray-200 p-1"
              onClick={handleCloseModal}
              aria-label="Cerrar"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {(typeModal === 'create' || typeModal === 'createTxt') && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                {typeModal === 'create' ? 'Nuevo nombre' : 'Nuevo comentario'}
              </label>
              <textarea
                name="archivo"
                value={inputRename}
                onChange={(e) => setInputRename(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {typeModal === 'edit' && itemData && (
            <div>
              <div className="text-left text-sm font-semibold text-zinc-900 mb-2">
                Nombre del archivo: {itemData.name}
              </div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Nuevo nombre
              </label>
              <textarea
                name="archivo"
                value={inputRename}
                onChange={(e) => setInputRename(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {typeModal === 'delete' && (
            <p className="text-sm text-zinc-600">
              Esta accion eliminara el archivo o carpeta para siempre. Confirme para continuar.
            </p>
          )}

          {typeModal === 'changeRole' && !loading && (
            <div className="max-h-[60vh] overflow-y-auto">
              <input
                type="text"
                placeholder="Buscar por nombre o codigo"
                value={searchUser}
                onChange={(e) => {
                  setSearchUser(e.target.value)
                  setCurrentPage(1)
                }}
                className="mb-3 w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <table className="min-w-full divide-y divide-gray-200 mb-4 border-t border-b border-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 w-32 text-left">Codigo</th>
                    <th className="px-4 py-2 text-left">Nombre</th>
                    <th className="px-4 py-2 w-40 text-center">Rutas</th>
                    <th className="px-4 py-2 w-40 text-center">Portafolio</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((usuario) => (
                    <tr key={usuario.idUsuario}>
                      <td className="px-4 py-2 w-32">{usuario.codigoDocente}</td>
                      <td className="px-4 py-2">{`${usuario.apellidoDocente} ${usuario.nombre}`}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleOpenRoutesModal(usuario)}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 rounded shadow"
                        >
                          Ver rutas
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={usuario.tieneRol15}
                            onChange={() => handleToggleSwitch(usuario.idUsuario)}
                            className="sr-only"
                          />
                          <div
                            className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${
                              usuario.tieneRol15 ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                                usuario.tieneRol15 ? 'translate-x-5' : ''
                              }`}
                            />
                          </div>
                          <span className="ml-2 text-xs">
                            {usuario.tieneRol15 ? 'ON' : 'OFF'}
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-center gap-2 my-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  variant="primary"
                >
                  Anterior
                </Button>
                <span className="px-2 py-1 text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  variant="primary"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-4">
            {typeModal === 'changeRole' ? (
              <Button onClick={handleApplyRoleChanges} variant="secondary">
                Listo
              </Button>
            ) : (
              renderActionButton()
            )}
          </div>
        </DialogContent>
      </Dialog>

      <WarningDialog
        isOpen={warningOpen}
        onClose={() => setWarningOpen(false)}
        title={warningConfig.title}
        message={warningConfig.message}
        onConfirm={() => setWarningOpen(false)}
      />
    </>
  )
}

export default ModalBriefCase
