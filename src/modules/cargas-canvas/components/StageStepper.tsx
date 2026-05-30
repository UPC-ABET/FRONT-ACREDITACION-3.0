'use client'

import { useI18n } from '@/providers'
import { STAGES } from '../types'
import type { StageCode } from '../types'

interface StageStepperProps {
  current: StageCode
  onChange: (stage: StageCode) => void
}

// Stepper horizontal (blueprint §4.2.1) — los 3 hitos del ciclo académico.
export default function StageStepper({ current, onChange }: StageStepperProps) {
  const { t } = useI18n()
  const labelKeyByStage: Record<StageCode, string> = {
    PRE_ENROLL: 'cargasCanvas.stage.preEnroll',
    START_TERM: 'cargasCanvas.stage.startTerm',
    END_TERM: 'cargasCanvas.stage.endTerm',
  }

  return (
    <nav aria-label="Stages" className="flex items-center gap-2">
      {STAGES.map((stage, idx) => {
        const isActive = stage === current
        const isPast = STAGES.indexOf(current) > idx
        return (
          <div key={stage} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onChange(stage)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'border-red-400 bg-red-50 text-red-700 shadow-sm'
                  : isPast
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive ? 'bg-red-500 text-white' : isPast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {idx + 1}
              </span>
              <span className="font-medium">{t(labelKeyByStage[stage])}</span>
            </button>
            {idx < STAGES.length - 1 && <span className="mx-2 hidden text-gray-300 md:inline">→</span>}
          </div>
        )
      })}
    </nav>
  )
}
