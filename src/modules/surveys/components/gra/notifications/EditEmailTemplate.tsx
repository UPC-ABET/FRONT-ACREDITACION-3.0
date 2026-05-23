'use client'

import React, { useEffect } from 'react'
import { Input, TextArea, Button, Badge, Toast } from '@/shared/components'
import { useGRAEmail } from '../../../hooks'

const EMAIL_PARAMS = [
  '[NOMBRE_ESTUDIANTE]',
  '[CODIGO_ESTUDIANTE]',
  '[EMAIL_ESTUDIANTE]',
  '[CARRERA]',
  '[CICLO]',
  '[LINK_ENCUESTA]',
  '[FECHA_ENVIO]',
]

interface EditEmailTemplateProps {
  idEncuesta: number
}

export function EditEmailTemplate({ idEncuesta }: EditEmailTemplateProps) {
  const { template, setTemplate, loading, saving, error, load, save } = useGRAEmail(idEncuesta)
  const [toast, setToast] = React.useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
    open: false, type: 'success', msg: '',
  })

  useEffect(() => { load() }, [load])

  function handleSave() {
    save(template, () => {
      setToast({ open: true, type: 'success', msg: 'Plantilla de correo guardada.' })
    })
  }

  function insertParam(param: string) {
    setTemplate((prev) => ({ ...prev, cuerpo: prev.cuerpo + param }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <span className="text-sm text-zinc-400">Cargando plantilla...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-bold text-zinc-700">Plantilla de Correo Electrónico</h4>
        <p className="text-xs text-zinc-500 mt-1">
          Personaliza el correo que se envía a los estudiantes con su encuesta.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <Input
        label="Asunto"
        value={template.asunto}
        onChange={(e) => setTemplate({ ...template, asunto: e.target.value })}
        placeholder="Ej: Encuesta de Graduandos UPC 2024"
      />

      <div className="space-y-2">
        <div>
          <label className="font-medium text-xs text-zinc-700 block mb-2">
            Parámetros disponibles
          </label>
          <div className="flex flex-wrap gap-1">
            {EMAIL_PARAMS.map((p) => (
              <button
                key={p}
                onClick={() => insertParam(p)}
                className="text-xs px-2 py-1 bg-zinc-100 rounded hover:bg-red-50 hover:text-red-700 transition-colors font-mono"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <TextArea
          label="Cuerpo del correo"
          value={template.cuerpo}
          onChange={(e) => setTemplate({ ...template, cuerpo: e.target.value })}
          placeholder="Escribe el contenido del correo..."
          rows={8}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar Plantilla'}
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
