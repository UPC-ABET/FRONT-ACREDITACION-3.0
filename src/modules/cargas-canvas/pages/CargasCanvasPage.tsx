'use client'

import { useState } from 'react'
import { useI18n } from '@/providers'
import { StageStepper, FlowRadialSelector, UploadCanvas } from '../components'
import type { FlowDescriptor, StageCode } from '../types'

interface CargasCanvasPageProps {
  // Dispatch del upload del flow. En New_ABET conecta con los servicios de uploads/
  // (uploadSections / uploadEnrolledStudents / ...) según `flow.code`. Inyectado por prop
  // para mantener este módulo desacoplado de los 12 services.
  onSubmit: (flow: FlowDescriptor, file: File) => Promise<void>
  onBannerScrap?: (flow: FlowDescriptor, credentials: { username: string; password: string }) => Promise<void>
  initialStage?: StageCode
}

// Vista 4.2 — Panel de Carga Masiva Inteligente & Banner Scrapping.
// Orquesta stepper + selector + dropzone con pre-validation.
export default function CargasCanvasPage({ onSubmit, onBannerScrap, initialStage = 'PRE_ENROLL' }: CargasCanvasPageProps) {
  const { t } = useI18n()
  const [stage, setStage] = useState<StageCode>(initialStage)
  const [flow, setFlow] = useState<FlowDescriptor | null>(null)

  const handleStageChange = (next: StageCode) => {
    setStage(next)
    setFlow(null) // reset al cambiar de hito
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">{t('cargasCanvas.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('cargasCanvas.subtitle')}</p>
      </header>

      <StageStepper current={stage} onChange={handleStageChange} />

      <FlowRadialSelector stage={stage} selectedFlowCode={flow?.code ?? null} onChange={setFlow} />

      <UploadCanvas flow={flow} onSubmit={onSubmit} onBannerScrap={onBannerScrap} />
    </div>
  )
}
