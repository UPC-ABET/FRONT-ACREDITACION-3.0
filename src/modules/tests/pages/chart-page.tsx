'use client'

import { Badge } from '@/shared/components'
import { ABETCompetenciesChart, ABETGraduationPie, ABETHistoricalTrend, ABETProjectAssessment } from '@/modules/tests/components'

export default function ChartPage() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Reporte de Acreditacion ABET</h1>
          <p className="text-zinc-500">Ciclo Academico 2026-I</p>
        </div>
        <Badge variant="default" className="bg-red-900 text-white px-4 py-1">
          Ciclo de Evaluacion
        </Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ABETCompetenciesChart />
        <ABETGraduationPie />
        <ABETHistoricalTrend />
        <ABETProjectAssessment />
      </div>
    </div>
  )
}
