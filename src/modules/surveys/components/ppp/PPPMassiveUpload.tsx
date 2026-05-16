'use client'

import React, { useEffect } from 'react'
import { Select } from '@/shared/components'
import { FileUploadPanel } from '../shared/FileUploadPanel'
import { usePPPUpload, usePPPCycles } from '../../hooks'
import { useABET } from '@/providers'

export function PPPMassiveUpload() {
  const { valueModality } = useABET()
  const { cycles, load: loadCycles } = usePPPCycles()
  const { loading, error, success, upload } = usePPPUpload()

  const [selectedCycle, setSelectedCycle] = React.useState<{ label: string; value: number } | null>(null)

  useEffect(() => { loadCycles(valueModality) }, [valueModality, loadCycles])

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))

  async function handleDownloadTemplate() {
    if (!selectedCycle) return
    const { downloadPPPTemplate } = await import('../../services/pppService')
    await downloadPPPTemplate(selectedCycle.value)
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h3 className="text-base font-bold text-zinc-800">Carga Masiva PPP</h3>
        <p className="text-sm text-zinc-500 mt-1">
          Descarga la plantilla, completa los datos y súbela para procesar masivamente.
        </p>
      </div>

      <Select
        label="Ciclo Académico"
        options={cycleOptions}
        value={selectedCycle}
        onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
        placeholder="Selecciona un ciclo"
        isSearchable
      />

      <FileUploadPanel
        title="Archivo de datos"
        uploading={loading}
        success={success}
        error={error}
        onUpload={upload}
        onDownloadTemplate={selectedCycle ? handleDownloadTemplate : undefined}
        downloadLabel="Descargar Plantilla PPP"
      />
    </div>
  )
}

