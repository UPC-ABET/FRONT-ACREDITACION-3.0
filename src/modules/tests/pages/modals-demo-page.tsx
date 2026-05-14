'use client'

import { useState } from 'react'
import {Button, Input, Select, LoadingDialog, ErrorDialog, SuccessDialog, WarningDialog, InfoDialog,
  ConfirmDialog, FormDialog, HoverCard, HoverCardContent, HoverCardTrigger,
} from '@/shared/components'

export default function ModalsDemoPage() {
  const [openForm, setOpenForm] = useState(false)
  const [openSuccess, setOpenSuccess] = useState(false)
  const [openError, setOpenError] = useState(false)
  const [openConfirm, setOpenConfirm] = useState(false)
  const [openInfo, setOpenInfo] = useState(false)
  const [openWarning, setOpenWarning] = useState(false)
  const [retryStatus, setRetryStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [isSaving, setIsSaving] = useState(false)

  const handleRetry = () => {
    setOpenError(false)
    setRetryStatus('loading')

    setTimeout(() => {
      const didFail = Math.random() < 0.5

      if (didFail) {
        setRetryStatus('error')
        setOpenError(true)
        return
      }

      setRetryStatus('success')
    }, 1200)
  }

  const handleSubmitForm = () => {
    setIsSaving(true)

    setTimeout(() => {
      setIsSaving(false)
      setOpenForm(false)
      setOpenSuccess(true)
    }, 1200)
  }

  return (
    <div className="space-y-8">
      <LoadingDialog isOpen={retryStatus === 'loading'} label="Reintentando ..." />
      <LoadingDialog isOpen={isSaving} label="Guardando ..." />

      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Gestion de Modales</h1>
        <p className="text-zinc-500">Prueba las diferentes interacciones del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button onClick={() => setOpenForm(true)} variant="dark">
          Abrir Formulario
        </Button>
        <Button onClick={() => setOpenSuccess(true)} variant="primary">
          Simular Exito
        </Button>
        <Button onClick={() => setOpenConfirm(true)} variant="surface">
          Confirmar Accion
        </Button>
        <Button onClick={() => setOpenWarning(true)} variant="warning">
          Ver Advertencia
        </Button>
        <Button onClick={() => setOpenError(true)} variant="neutral">
          Simular Error
        </Button>
        <Button onClick={() => setOpenInfo(true)} variant="info">
          Ver Info
        </Button>
      </div>

      <FormDialog
        isOpen={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmitForm}
      >
        <div className="grid grid-cols-1 gap-4">
          <Input label="Nombre completo" placeholder="Nombre y Apellido" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Codigo" placeholder="U202..." />
            <Select
              label="Ciclo Actual"
              placeholder="Seleccione ciclo"
              options={[
                { label: '2026-I', value: '1' },
                { label: '2026-II', value: '2' },
              ]}
            />
          </div>
        </div>
      </FormDialog>

      <SuccessDialog isOpen={openSuccess} onClose={() => setOpenSuccess(false)} message="" />

      <ConfirmDialog
        isOpen={openConfirm}
        onClose={() => setOpenConfirm(false)}
        message=""
        onConfirm={() => {
          console.log('Eliminado...')
          setOpenConfirm(false)
        }}
        onDecline={() => setOpenConfirm(false)}
      />

      <WarningDialog
        isOpen={openWarning}
        onClose={() => setOpenWarning(false)}
        message=""
        onConfirm={() => setOpenWarning(false)}
        onDecline={() => setOpenWarning(false)}
      />

      <ErrorDialog
        isOpen={openError}
        onClose={() => setOpenError(false)}
        message=""
        onConfirm={handleRetry}
      />

      <InfoDialog
        isOpen={openInfo}
        onClose={() => setOpenInfo(false)}
        title="Guia de Usuario"
        message=""
      />

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Elementos UI</h2>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <HoverCard openDelay={10} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button variant="ghost" className="text-red-600 hover:text-red-700">
                Hover aqui
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="flex flex-col gap-3">
              <div className="text-sm text-zinc-700">
                Lista de alumnos matriculados al 202-01.
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </div>
  )
}
