'use client'

import React, { useEffect, useState } from 'react'
import { Select, Toast } from '@/shared/components'
import { FileUploadPanel } from '../shared/FileUploadPanel'
import { usePPPUpload, usePPPCycles } from '../../hooks'
import { useABET } from '@/providers'

export function PPPMassiveUpload() {
  const { modalityTypeId } = useABET()
  const { cycles, load: loadCycles } = usePPPCycles()
  const { loading, error, success, upload } = usePPPUpload()

  const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'error', msg: '',
  })

  useEffect(() => { loadCycles(modalityTypeId) }, [modalityTypeId, loadCycles])

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))

  async function handleDownloadTemplate() {
    if (!selectedCycle) return
    try {
      const { downloadPPPTemplate } = await import('../../services/pppService')
      await downloadPPPTemplate(selectedCycle.value)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al descargar la plantilla.'
      setToast({ open: true, type: 'error', msg })
    }
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
        onUpload={(file) => selectedCycle ? upload(file, selectedCycle.value) : Promise.resolve()}
        onDownloadTemplate={selectedCycle ? handleDownloadTemplate : undefined}
        downloadLabel="Descargar Plantilla PPP"
      />

      <Toast
        isOpen={toast.open}
        type={toast.type}
        message={toast.msg}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  )
}

