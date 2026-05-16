'use client'

import React, { useEffect, useState } from 'react'
import { Select, Button, Toast } from '@/shared/components'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { usePPPReports, usePPPCycles } from '../../hooks'
import { useABET } from '@/providers'
import { triggerFileDownload } from '../../services'

export function PPPReports() {
  const { valueModality } = useABET()
  const { cycles, load: loadCycles } = usePPPCycles()
  const { loading, error, reportData, generate } = usePPPReports()

  const [cycle, setCycle] = useState<{ label: string; value: number } | null>(null)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => { loadCycles(valueModality) }, [valueModality, loadCycles])
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

  function handleDownloadZip() {
    if (!reportData?.zipFile) return
    triggerFileDownload(
      reportData.zipFile.base64Content,
      'application/zip',
      reportData.zipFile.fileName
    )
  }

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h3 className="text-base font-bold text-zinc-800">Reporte de Percepción Promedio PPP</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Genera el reporte de percepción promedio por ciclo académico.
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
          {loading ? 'Generando...' : 'Generar Reporte'}
        </Button>
      </div>

      {reportData && (
        <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
          <p className="text-sm font-bold text-zinc-700">
            Reporte generado ({reportData.pdfFiles?.length ?? 0} archivo(s))
          </p>

          {reportData.pdfFiles && reportData.pdfFiles.length > 0 && (
            <ul className="space-y-1">
              {reportData.pdfFiles.map((f) => (
                <li key={f.fileName} className="flex items-center gap-2">
                  <DocumentArrowDownIcon className="h-4 w-4 text-red-500" />
                  <button
                    className="text-sm text-red-600 hover:underline"
                    onClick={() =>
                      triggerFileDownload(f.base64Content, 'application/pdf', f.fileName)
                    }
                  >
                    {f.fileName}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {reportData.zipFile && (
            <Button variant="surface" size="sm" onClick={handleDownloadZip}>
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              Descargar ZIP completo
            </Button>
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
