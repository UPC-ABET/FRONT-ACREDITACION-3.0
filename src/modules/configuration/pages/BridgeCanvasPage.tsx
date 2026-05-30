'use client'

import { useState } from 'react'
import { useI18n } from '@/providers'
import {
  PeriodSelector,
  NewPeriodDialog,
  StudyPlanAssociationPanel,
  ProgramCommissionPanel,
} from '../components'

interface ProgramOption {
  id: number
  code: string
  label: string
}
interface CommissionOption {
  id: number
  code: string
  label: string
}
interface StudyPlanOption {
  id: number
  code: string
  label: string
}

interface BridgeCanvasPageProps {
  // En New_ABET vendrán de useStudyPlans/usePrograms/useCommissions (módulos academic / accreditation).
  // Aquí se reciben por prop para mantener el módulo de configuración desacoplado.
  availableStudyPlans: StudyPlanOption[]
  programs: ProgramOption[]
  commissions: CommissionOption[]
}

// Vista 4.1 — The Bridge Canvas (blueprint §4.1).
// Orquesta Fase 0: selector de ciclo + asociación malla×ciclo + asociación carrera×comisión.
export default function BridgeCanvasPage({ availableStudyPlans, programs, commissions }: BridgeCanvasPageProps) {
  const { t } = useI18n()
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null)
  const [newPeriodOpen, setNewPeriodOpen] = useState(false)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">{t('configuration.canvas.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('configuration.canvas.subtitle')}</p>
      </header>

      <section>
        <PeriodSelector
          selectedPeriodId={selectedPeriodId}
          onChange={setSelectedPeriodId}
          onCreate={() => setNewPeriodOpen(true)}
        />
      </section>

      <section>
        <StudyPlanAssociationPanel periodId={selectedPeriodId} availableStudyPlans={availableStudyPlans} />
      </section>

      <section>
        <ProgramCommissionPanel periodId={selectedPeriodId} programs={programs} commissions={commissions} />
      </section>

      <NewPeriodDialog
        open={newPeriodOpen}
        onClose={() => setNewPeriodOpen(false)}
        onCreated={(periodId) => setSelectedPeriodId(periodId)}
      />
    </div>
  )
}
