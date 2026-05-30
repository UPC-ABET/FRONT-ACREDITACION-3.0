'use client'

import { useI18n } from '@/providers'
import { FLOWS_BY_STAGE } from '../constants'
import type { FlowDescriptor, StageCode } from '../types'

interface FlowRadialSelectorProps {
  stage: StageCode
  selectedFlowCode: string | null
  onChange: (flow: FlowDescriptor) => void
}

// Selector radial de flow dentro del hito (blueprint §4.2.2).
// El dropzone adyacente cambia su título/ícono en función del flow seleccionado.
export default function FlowRadialSelector({ stage, selectedFlowCode, onChange }: FlowRadialSelectorProps) {
  const { t } = useI18n()
  const flows = FLOWS_BY_STAGE[stage] ?? []

  return (
    <div className="flex flex-wrap gap-2">
      {flows.map((flow) => {
        const active = flow.code === selectedFlowCode
        return (
          <button
            key={flow.code}
            type="button"
            onClick={() => onChange(flow)}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              active
                ? 'border border-red-400 bg-red-50 font-medium text-red-700'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-red-300'
            }`}
          >
            {active && <span className="mr-1">●</span>}
            {t(flow.displayKey)}
            {flow.canBannerScrap && <span className="ml-2 text-xs text-blue-600">⚡</span>}
          </button>
        )
      })}
    </div>
  )
}
