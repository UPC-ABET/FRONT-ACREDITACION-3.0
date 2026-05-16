'use client'

import React, { useEffect, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Select,
  Button,
  Badge,
  DataTable,
  TextArea,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Toast,
} from '@/shared/components'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useLCFCStudents, useLCFCEmail, useLCFCCycles } from '../../../hooks'
import { useABET } from '@/providers'
import type { LCFCStudent } from '../../../types'

export function LCFCNotificationView() {
  const { valueModality } = useABET()
  const { cycles, load: loadCycles } = useLCFCCycles()
  const { students, total, loading: loadingStudents, load: loadStudents } = useLCFCStudents()
  const { params: emailParams, loading: loadingParams, sending, loadParams, send } = useLCFCEmail()

  const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null)
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => { loadCycles(valueModality) }, [valueModality, loadCycles])
  useEffect(() => { loadParams() }, [loadParams])
  useEffect(() => {
    if (selectedCycle) loadStudents(selectedCycle.value, selectedCycle.value)
  }, [selectedCycle, loadStudents])

  function handleSend() {
    if (!selectedCycle) return
    send(
      {
        idCiclo: selectedCycle.value,
        idPeriodo: selectedCycle.value,
        destinatarios: 'TODOS',
        asunto,
        cuerpo,
      },
      () => {
        setSendDialogOpen(false)
        setToast({ open: true, type: 'success', msg: 'Notificaciones enviadas exitosamente.' })
      }
    )
  }

  const columns: ColumnDef<LCFCStudent>[] = [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nombre', header: 'Nombre' },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'encuestaEnviada',
      header: 'Enviada',
      cell: ({ getValue }) => (
        <Badge variant={(getValue() as boolean) ? 'success' : 'outline'}>
          {(getValue() as boolean) ? 'Sí' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'encuestaCompletada',
      header: 'Completada',
      cell: ({ getValue }) => (
        <Badge variant={(getValue() as boolean) ? 'success' : 'outline'}>
          {(getValue() as boolean) ? 'Sí' : 'No'}
        </Badge>
      ),
    },
  ]

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))

  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <Select
          label="Ciclo Académico"
          options={cycleOptions}
          value={selectedCycle}
          onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
          placeholder="Selecciona un ciclo"
          isSearchable
        />
      </div>

      {selectedCycle && (
        <>
          <DataTable
            columns={columns}
            data={students}
            title={`Estudiantes (${total})`}
            actions={[
              {
                label: 'Enviar Notificaciones',
                onClick: () => setSendDialogOpen(true),
                icon: <PaperAirplaneIcon className="h-4 w-4" />,
              },
            ]}
          />

          {/* Send dialog */}
          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Enviar Notificaciones LCFC</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <p className="text-xs text-zinc-500 mb-2">Parámetros disponibles:</p>
                  <div className="flex flex-wrap gap-1">
                    {emailParams.map((p) => (
                      <button
                        key={p.nombre}
                        onClick={() => setCuerpo((prev) => prev + p.nombre)}
                        className="text-xs px-2 py-1 bg-zinc-100 rounded hover:bg-red-50 hover:text-red-700 font-mono transition-colors"
                        title={p.description}
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Asunto"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Encuesta de Logro de Fin de Ciclo"
                />

                <TextArea
                  label="Cuerpo del correo"
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  rows={6}
                  placeholder="Estimado [NOMBRE_ESTUDIANTE], ..."
                />
              </div>

              <DialogFooter showCloseButton>
                <Button onClick={handleSend} disabled={sending || !asunto.trim() || !cuerpo.trim()}>
                  {sending ? 'Enviando...' : 'Enviar a Todos'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      <Toast
        isOpen={toast.open}
        type={toast.type}
        message={toast.msg}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  )
}
