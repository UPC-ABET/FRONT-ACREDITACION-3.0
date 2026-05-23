'use client'

import React, { useEffect, useState } from 'react'
import { Select, Button, Toast } from '@/shared/components'
import { usePPPReports, usePPPCycles } from '../../hooks'
import { useABET } from '@/providers'

export function PPPReports() {
  const { modalityTypeId } = useABET()
  const { cycles, load: loadCycles } = usePPPCycles()
  const { loading, error, reportData, generate } = usePPPReports()

  const [cycle, setCycle] = useState<{ label: string; value: number } | null>(null)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => { loadCycles(modalityTypeId) }, [modalityTypeId, loadCycles])
  useEffect(() => {
    if (error) setToast({ open: true, type: 'error', msg: error })
  }, [error])

  async function handleGenerate() {
    if (!cycle) {
      setToast({ open: true, type: 'error', msg: 'Selecciona un ciclo académico.' })
      return
    }
    await generate({ idPeriodoAcademico: cycle.value })
  }

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-800">Dashboard PPP</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Genera el resumen de percepción promedio por ciclo académico.
        </p>
      </div>

      <div className="space-y-4">
        <Select
          label="Ciclo Académico"
          options={cycleOptions}
          value={cycle}
          onChange={(_, val) => setCycle(val as { label: string; value: number } | null)}
          placeholder="Selecciona un ciclo"
          isSearchable
        />

        <Button onClick={handleGenerate} disabled={loading || !cycle}>
          {loading ? 'Generando...' : 'Generar Dashboard'}
        </Button>
      </div>

      {reportData && (
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <p className="text-sm font-bold text-zinc-700">Resumen</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-zinc-500 block">Total encuestas</span>
              <span className="font-semibold">{reportData.summary?.total_surveys ?? '—'}</span>
            </div>
            {reportData.summary?.completion_rate_pct !== undefined && (
              <div>
                <span className="text-xs text-zinc-500 block">Tasa de completitud</span>
                <span className="font-semibold">{reportData.summary.completion_rate_pct}%</span>
              </div>
            )}
            {reportData.summary?.verde !== undefined && (
              <div>
                <span className="text-xs text-zinc-500 block">Verde / Amarillo / Rojo</span>
                <span className="font-semibold">
                  {reportData.summary.verde} / {reportData.summary.amarillo} / {reportData.summary.rojo}
                </span>
              </div>
            )}
          </div>
          {reportData.outcomes && reportData.outcomes.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold text-zinc-600 mb-2">Outcomes</p>
              <ul className="space-y-1">
                {reportData.outcomes.map((o) => (
                  <li key={o.outcome_id} className="flex items-center justify-between text-xs">
                    <span className="text-zinc-700 truncate max-w-xs">{o.outcome_name}</span>
                    <span className="font-semibold ml-2">{o.average_score.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
