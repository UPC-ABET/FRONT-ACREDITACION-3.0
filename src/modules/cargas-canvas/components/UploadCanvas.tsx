'use client'

import { useRef, useState } from 'react'
import { Button, Card } from '@/shared/components'
import { useI18n } from '@/providers'
import { useExcelHeaderValidator } from '../hooks'
import type { FlowDescriptor } from '../types'
import BannerScrapingDialog from './BannerScrapingDialog'

// Local interpolation helper: develop's t(key) returns a plain string (no placeholders).
const interpolate = (tpl: string, params: Record<string, string | number>): string =>
  Object.entries(params).reduce((s, [k, v]) => s.split(`{${k}}`).join(String(v)), tpl)

interface UploadCanvasProps {
  flow: FlowDescriptor | null
  // Dispatch al servicio correspondiente al flow seleccionado. La canvas no conoce
  // las firmas particulares — la página orquestadora resuelve y pasa este callback.
  onSubmit: (flow: FlowDescriptor, file: File) => Promise<void>
  // Idem para Banner scraping del flow.
  onBannerScrap?: (flow: FlowDescriptor, credentials: { username: string; password: string }) => Promise<void>
}

// Dropzone multifuncional con título dinámico y pre-validation engine (blueprint §4.2.2 + §4.2.3).
// Cuando el flow seleccionado lo soporta, también expone el botón "Jalar de Banner".
export default function UploadCanvas({ flow, onSubmit, onBannerScrap }: UploadCanvasProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const validateHeader = useExcelHeaderValidator()
  const [file, setFile] = useState<File | null>(null)
  const [validation, setValidation] = useState<{ missing: string[]; ok: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)

  const handleFile = async (selected: File | null) => {
    setFile(selected)
    setValidation(null)
    if (!selected || !flow) return
    const result = await validateHeader(selected, flow.expectedHeaders)
    setValidation({ missing: result.missing, ok: result.ok })
  }

  const handleSubmit = async () => {
    if (!file || !flow || validation?.ok !== true) return
    setSubmitting(true)
    try {
      await onSubmit(flow, file)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } finally {
      setSubmitting(false)
    }
  }

  if (!flow) {
    return (
      <Card title={t('cargasCanvas.upload.title')} description={t('cargasCanvas.upload.pickFlow')}>
        <p className="py-6 text-center text-sm text-gray-500">{t('cargasCanvas.upload.noFlowSelected')}</p>
      </Card>
    )
  }

  const isInvalid = validation !== null && !validation.ok

  return (
    <Card title={`${t('cargasCanvas.upload.title')} — ${t(flow.displayKey)}`} description={interpolate(t('cargasCanvas.upload.dragHintWith'), { flow: t(flow.displayKey) })}>
      <div className="space-y-4">
        <label
          htmlFor="canvas-file"
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
            isInvalid ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:border-red-300'
          }`}
        >
          <span className="text-sm font-medium text-gray-700">{file ? file.name : t('cargasCanvas.upload.dropzone')}</span>
          <span className="mt-1 text-xs text-gray-400">.xlsx</span>
          <input
            id="canvas-file"
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {isInvalid && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2">
            <p className="text-sm font-medium text-red-700">{t('cargasCanvas.upload.invalidHeaders')}</p>
            <p className="mt-1 text-xs text-red-600">
              {t('cargasCanvas.upload.missingColumns')}: {validation!.missing.join(', ')}
            </p>
          </div>
        )}

        {validation?.ok && (
          <p className="text-sm text-green-700">✓ {t('cargasCanvas.upload.headersValid')}</p>
        )}

        <div className="flex justify-between gap-3">
          {flow.canBannerScrap && onBannerScrap && (
            <Button variant="secondary" onClick={() => setBannerOpen(true)} disabled={submitting}>
              ⚡ {t('cargasCanvas.banner.pullFromBanner')}
            </Button>
          )}
          <Button variant="primary" onClick={handleSubmit} disabled={!validation?.ok || submitting}>
            {submitting ? t('cargasCanvas.upload.submitting') : t('cargasCanvas.upload.submit')}
          </Button>
        </div>
      </div>

      {flow.canBannerScrap && onBannerScrap && (
        <BannerScrapingDialog
          open={bannerOpen}
          onClose={() => setBannerOpen(false)}
          flowDisplayKey={flow.displayKey}
          onTrigger={(creds) => onBannerScrap(flow, creds)}
        />
      )}
    </Card>
  )
}
