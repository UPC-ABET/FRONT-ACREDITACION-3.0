'use client'

import React, { useEffect, useState } from 'react'
import { Select, Button, Tabs, Toast } from '@/shared/components'
import { usePPPCompetences, usePPPCycles, usePPPAcceptanceLevels } from '../../../hooks'
import { useABET } from '@/providers'
import { CompetenceCRUD } from '../../shared/CompetenceCRUD'
import { AcceptanceLevels } from './AcceptanceLevels'

const TABS = [
  { id: 'competences', label: 'Competencias' },
  { id: 'levels', label: 'Niveles de Aceptación' },
]

export function PPPConfiguration() {
  const { valueModality } = useABET()
  const { cycles, load: loadCycles } = usePPPCycles()
  const {
    competences,
    loading: compLoading,
    error: compError,
    load: loadComp,
    save: saveComp,
    remove: removeComp,
    clone: cloneComp,
  } = usePPPCompetences()
  const levelsHook = usePPPAcceptanceLevels()

  const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null)
  const [activeTab, setActiveTab] = useState('competences')
  const [showClone, setShowClone] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => { loadCycles(valueModality) }, [valueModality, loadCycles])

  useEffect(() => {
    if (!selectedCycle) return
    loadComp(selectedCycle.value)
    levelsHook.load(selectedCycle.value)
  }, [selectedCycle]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedCycle && competences.length === 0 && !compLoading) {
      setShowClone(true)
    } else {
      setShowClone(false)
    }
  }, [competences, compLoading, selectedCycle])

  const cycleOptions = cycles.map((c) => ({ label: c.nombre, value: c.id }))

  return (
    <div className="space-y-6">
      <div className="max-w-sm">
        <Select
          label="Ciclo Académico"
          options={cycleOptions}
          value={selectedCycle}
          onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
          placeholder="Selecciona un ciclo"
          isSearchable
        />
      </div>

      {selectedCycle && showClone && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              Sin configuración para este ciclo
            </p>
            <p className="text-xs text-amber-700 mt-1">
              No existe configuración para el ciclo seleccionado. Puedes crear una nueva o clonar desde otro ciclo.
            </p>
          </div>
          <Button
            size="sm"
            variant="warning"
            onClick={() => {
              setToast({ open: true, type: 'info' as 'success', msg: 'Función de clonado: selecciona un ciclo de origen en el modal.' })
            }}
          >
            Clonar configuración
          </Button>
        </div>
      )}

      {selectedCycle && (
        <>
          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

          <div className="pt-2">
            {activeTab === 'competences' && (
              <CompetenceCRUD
                cycleId={selectedCycle.value}
                competences={competences}
                loading={compLoading}
                error={compError}
                onLoad={loadComp}
                onSave={saveComp}
                onDelete={removeComp}
                onClone={cloneComp}
                showCloneOption={showClone}
              />
            )}

            {activeTab === 'levels' && (
              <AcceptanceLevels
                cycleId={selectedCycle.value}
                levels={levelsHook.levels}
                setLevels={levelsHook.setLevels}
                loading={levelsHook.loading}
                error={levelsHook.error}
                onLoad={levelsHook.load}
                onSave={levelsHook.save}
              />
            )}
          </div>
        </>
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
