'use client'

import React, { useEffect, useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import {
  Select,
  Button,
  Badge,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Toast,
} from '@/shared/components'
import { SparklesIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { useLCFCConfiguration, useLCFCCycles } from '../../../hooks'
import { useABET } from '@/providers'
import type { LCFCCourse } from '../../../types'

export function LCFCConfiguration() {
  const { modalityTypeId } = useABET()
  const { cycles, load: loadCycles } = useLCFCCycles()
  const {
    courses,
    loading,
    error,
    load: loadConfig,
    generate,
    clone,
    changeStatus,
  } = useLCFCConfiguration()

  const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null)
  const [originCycle, setOriginCycle] = useState<{ label: string; value: number } | null>(null)
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => { loadCycles(modalityTypeId) }, [modalityTypeId, loadCycles])

  useEffect(() => {
    if (selectedCycle) loadConfig('1', selectedCycle.value)
  }, [selectedCycle, loadConfig])

  useEffect(() => {
    if (error) setToast({ open: true, type: 'error', msg: error })
  }, [error])

  function handleGenerate() {
    if (!selectedCycle) return
    generate('1', selectedCycle.value, undefined, undefined, () => {
      setToast({ open: true, type: 'success', msg: 'Configuración generada exitosamente.' })
      loadConfig('1', selectedCycle.value)
    })
  }

  function handleClone() {
    if (!selectedCycle || !originCycle) return
    clone(originCycle.value, selectedCycle.value, () => {
      setCloneDialogOpen(false)
      setToast({ open: true, type: 'success', msg: 'Configuración clonada exitosamente.' })
      loadConfig('1', selectedCycle.value)
    })
  }

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))

  const columns: ColumnDef<LCFCCourse>[] = [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nombreCurso', header: 'Curso' },
    {
      accessorKey: 'comisiones',
      header: 'Comisiones',
      cell: ({ getValue }) => {
        const list = getValue() as Array<{ idComision: number; nombreComision: string }>
        return (
          <div className="flex flex-wrap gap-1">
            {list.map((c) => (
              <Badge key={c.idComision} variant="outline">
                {c.nombreComision}
              </Badge>
            ))}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <Select
          label="Ciclo / Período"
          options={cycleOptions}
          value={selectedCycle}
          onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
          placeholder="Selecciona un período"
          isSearchable
        />
      </div>

      {selectedCycle && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleGenerate} disabled={loading}>
            <SparklesIcon className="h-4 w-4 mr-1" />
            Generar Configuración
          </Button>
          <Button size="sm" variant="surface" onClick={() => setCloneDialogOpen(true)}>
            <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
            Clonar desde otro período
          </Button>
        </div>
      )}

      {selectedCycle && (
        <DataTable
          columns={columns}
          data={courses}
          title={`Cursos configurados (${courses.length})`}
        />
      )}

      {/* Clone dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clonar configuración</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-zinc-600">
              Selecciona el período de origen para clonar su configuración al período actual (
              <strong>{selectedCycle?.label}</strong>).
            </p>
            <Select
              label="Período de origen"
              options={cycleOptions.filter((c) => c.value !== selectedCycle?.value)}
              value={originCycle}
              onChange={(_, val) => setOriginCycle(val as { label: string; value: number } | null)}
              placeholder="Selecciona un período de origen"
            />
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleClone} disabled={!originCycle}>
              Clonar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast
        isOpen={toast.open}
        type={toast.type}
        message={toast.msg}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  )
}
