'use client'

import React, { useEffect, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Toast } from '@/shared/components'
import { TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useGRAStudents, useGRAEmail } from '../../../hooks'
import type { GRAStudent, SendEmailRequest } from '../../../types'

interface StudentListProps {
  idEncuesta: number
}

export function StudentList({ idEncuesta }: StudentListProps) {
  const { students, loading, error, load, remove } = useGRAStudents(idEncuesta)
  const { sending, send } = useGRAEmail(idEncuesta)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [sendMode, setSendMode] = useState<'TODOS' | 'SELECCIONADOS' | null>(null)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => { load() }, [load])

  function handleDelete(id: number) {
    remove(id, () => {
      setDeleteId(null)
      setToast({ open: true, type: 'success', msg: 'Estudiante eliminado de la notificación.' })
      load()
    })
  }

  function handleSendAll() {
    const req: SendEmailRequest = { idEncuesta, destinatarios: 'TODOS' }
    send(req, () => {
      setSendMode(null)
      setToast({ open: true, type: 'success', msg: 'Encuestas enviadas exitosamente.' })
    })
  }

  const columns: ColumnDef<GRAStudent>[] = [
    { accessorKey: 'codigoEstudiante', header: 'Código' },
    { accessorKey: 'nombreEstudiante', header: 'Nombre' },
    { accessorKey: 'emailEstudiante', header: 'Email' },
    {
      accessorKey: 'estadoEnvio',
      header: 'Envío',
      cell: ({ getValue }) => {
        const v = getValue() as string
        return (
          <Badge variant={v === 'ENVIADO' ? 'default' : 'outline'}>
            {v ?? 'PENDIENTE'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'estadoRespuesta',
      header: 'Respuesta',
      cell: ({ getValue }) => {
        const v = getValue() as string | undefined
        if (!v) return <span className="text-zinc-400 text-xs">—</span>
        return <Badge variant={v === 'RESPONDIDO' ? 'success' : 'outline'}>{v}</Badge>
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="warning"
          onClick={() => setDeleteId(row.original.idNotificacion)}
          aria-label="Eliminar"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      <DataTable
        columns={columns}
        data={students}
        title={`Estudiantes Notificados (${students.length})`}
        actions={[
          {
            label: 'Enviar Encuesta a Todos',
            onClick: () => setSendMode('TODOS'),
            icon: <PaperAirplaneIcon className="h-4 w-4" />,
          },
        ]}
      />

      {/* Delete confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar estudiante</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 py-2">
            ¿Deseas eliminar este estudiante de la notificación?
          </p>
          <DialogFooter showCloseButton>
            <Button variant="warning" onClick={() => deleteId !== null && handleDelete(deleteId)}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send confirm */}
      <Dialog open={sendMode !== null} onOpenChange={() => setSendMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar encuesta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 py-2">
            ¿Confirmas el envío de la encuesta a <strong>todos</strong> los estudiantes notificados?
          </p>
          <DialogFooter showCloseButton>
            <Button onClick={handleSendAll} disabled={sending}>
              {sending ? 'Enviando...' : 'Confirmar envío'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast
        isOpen={toast.open}
        type={toast.type}
        message={toast.msg}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  )
}
