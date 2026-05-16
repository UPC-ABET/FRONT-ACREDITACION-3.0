'use client'

import React, { useEffect } from 'react'
import { Button, Input, Toast } from '@/shared/components'
import type { AcceptanceLevel } from '../../../types'

interface AcceptanceLevelsProps {
  cycleId: number
  levels: AcceptanceLevel[]
  setLevels: React.Dispatch<React.SetStateAction<AcceptanceLevel[]>>
  loading: boolean
  error: string | null
  onLoad: (cycleId: number) => void
  onSave: (cycleId: number, niveles: AcceptanceLevel[], onSuccess?: () => void) => void
}

const DEFAULT_LEVELS: AcceptanceLevel[] = [
  { nivel: 1, descripcion: 'Insuficiente', rango: '0-40%' },
  { nivel: 2, descripcion: 'Regular', rango: '41-60%' },
  { nivel: 3, descripcion: 'Bueno', rango: '61-75%' },
  { nivel: 4, descripcion: 'Muy Bueno', rango: '76-90%' },
  { nivel: 5, descripcion: 'Excelente', rango: '91-100%' },
]

export function AcceptanceLevels({
  cycleId,
  levels,
  setLevels,
  loading,
  error,
  onLoad,
  onSave,
}: AcceptanceLevelsProps) {
  const [saving, setSaving] = React.useState(false)
  const [toast, setToast] = React.useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => {
    if (cycleId) onLoad(cycleId)
  }, [cycleId, onLoad])

  const displayLevels = levels.length > 0 ? levels : DEFAULT_LEVELS

  function updateLevel(index: number, field: keyof AcceptanceLevel, value: string) {
    setLevels((prev) => {
      const updated = [...(prev.length > 0 ? prev : DEFAULT_LEVELS)]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function handleSave() {
    setSaving(true)
    onSave(cycleId, displayLevels, () => {
      setSaving(false)
      setToast({ open: true, type: 'success', msg: 'Niveles de aceptación guardados.' })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-sm text-zinc-400">Cargando niveles...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-zinc-700">Niveles de Aceptación</h4>
        <p className="text-xs text-zinc-500 mt-1">
          Configura las descripciones y rangos para cada nivel de evaluación (1–5).
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
      )}

      <div className="space-y-3">
        {displayLevels.map((level, idx) => (
          <div
            key={level.nivel}
            className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg border border-zinc-200"
          >
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-white text-sm font-bold shrink-0">
              {level.nivel}
            </span>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <Input
                placeholder="Descripción"
                value={level.descripcion}
                onChange={(e) => updateLevel(idx, 'descripcion', e.target.value)}
              />
              <Input
                placeholder="Rango (ej: 0-40%)"
                value={level.rango}
                onChange={(e) => updateLevel(idx, 'rango', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Niveles'}
      </Button>

      <Toast
        isOpen={toast.open}
        type={toast.type}
        message={toast.msg}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  )
}
