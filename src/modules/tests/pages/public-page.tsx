'use client'

import React, { useState } from 'react'
import {Card, Toggle, TextArea, Tabs, Toast, Skeleton, Button, Title, SubTitle, Checkbox,
} from '@/shared/components'

export default function PublicPage() {
  const [activeTab, setActiveTab] = useState('info')
  const [switchEnabled, setSwitchEnabled] = useState(false)
  const [textValue, setTextValue] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const tabOptions = [
    { id: 'info', label: 'Informacion General' },
    { id: 'evidences', label: 'Evidencias ABET' },
    { id: 'logs', label: 'Logs de Auditoria' },
  ]

  const [toastState, setToastState] = useState({
    open: false,
    type: 'success' as 'success' | 'error' | 'warning',
  })

  const triggerToast = (type: 'success' | 'error' | 'warning') => {
    setToastState({ open: true, type })
    setTimeout(() => setToastState((prev) => ({ ...prev, open: false })), 3000)
  }

  return (
    <div className="space-y-8">
      <Title title="Componentes" />

      <section className="space-y-4">
        <SubTitle name="1. Navegacion por Tabs" />
        <Card>
          <Tabs tabs={tabOptions} activeTab={activeTab} onChange={setActiveTab} />
          <div className="py-6 text-sm text-zinc-600">
            {activeTab === 'info' && <p>Mostrando el formulario de datos generales del alumno...</p>}
            {activeTab === 'evidences' && <p>Listado de archivos PDF cargados para acreditacion.</p>}
            {activeTab === 'logs' && <p>Historial de cambios realizados por el docente.</p>}
          </div>
        </Card>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="space-y-4">
          <SubTitle name="2. Text Area" />
          <TextArea
            label="Comentarios de Mejora Continua"
            placeholder="Describe las acciones correctivas tomadas en este ciclo..."
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            error={textValue.length > 0 && textValue.length < 10 ? 'El informe debe ser mas descriptivo' : ''}
          />
        </section>

        <section className="space-y-4">
          <SubTitle name="3. Toogle" />
          <Card className="flex flex-col gap-6">
            <Toggle
              label="Estado de Acreditacion"
              description="Activar para marcar este resultado como CUMPLIDO."
              checked={switchEnabled}
              onChange={setSwitchEnabled}
            />
            <div
              className={`p-2 rounded text-center text-[10px] font-bold uppercase transition-all ${
                switchEnabled
                  ? 'bg-red-50 text-red-600 border border-red-100'
                  : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
              }`}
            >
              {switchEnabled ? 'Resultado Verificado' : 'Pendiente de Revision'}
            </div>
          </Card>
        </section>
      </div>

      <section className="space-y-4">
        <SubTitle name="4. Skeleton" />
        <div className="flex items-start gap-4 p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      </section>

      <section className="space-y-4 pb-10">
        <SubTitle name="5. Toast" />

        <div className="flex flex-wrap gap-4">
          <Button onClick={() => triggerToast('success')} className="bg-emerald-600 hover:bg-emerald-700">
            Test Exito
          </Button>

          <Button onClick={() => triggerToast('error')} className="bg-red-600 hover:bg-red-700">
            Test Error
          </Button>

          <Button onClick={() => triggerToast('warning')} className="bg-amber-500 hover:bg-amber-600">
            Test Aviso
          </Button>
        </div>

        <Toast
          isOpen={toastState.open}
          type={toastState.type}
          onClose={() => setToastState((prev) => ({ ...prev, open: false }))}
        />
      </section>

      <section className="space-y-4">
        <SubTitle name="6. Checkbox" />
        <div className="flex items-center gap-2">
          <Checkbox
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
          />
          <span className="text-sm text-zinc-700">Acepto los terminos y condiciones</span>
        </div>
      </section>
    </div>
  )
}
