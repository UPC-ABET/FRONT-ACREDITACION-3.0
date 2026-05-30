'use client'

import { useRef, useState } from 'react'
import { Card, Button, SuccessDialog, ErrorDialog, LoadingDialog } from '@/shared/components'
import { useI18n } from '@/providers'
import { useSectionsUpload, downloadErrorExcel } from '../hooks'
import type { UploadResult } from '../types'

interface SectionsUploadFormProps {
  academicPeriodId: number
}

// Sections bulk upload. Replica of BulkUploadView (ABET 2.0) with the new front-end UI.
// Contract: ALL-OR-NOTHING. On row errors the backend returns the annotated Excel (base64)
// and we offer it for download (same as the legacy "Errores_*" download).
export default function SectionsUploadForm({ academicPeriodId }: SectionsUploadFormProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const upload = useSectionsUpload()

  const handleFileChange = (selected: File | null) => {
    setLocalError(null)
    setResult(null)
    setFile(selected)
  }

  const handleUpload = () => {
    if (!file) {
      setLocalError(t('uploads.sections.error.fileRequired'))
      return
    }
    if (!academicPeriodId) {
      setLocalError(t('uploads.sections.error.periodRequired'))
      return
    }

    upload.mutate(
      { file, academicPeriodId },
      {
        onSuccess: (data) => {
          setResult(data)
          if (data.success) {
            setSuccessOpen(true)
            setFile(null)
            if (inputRef.current) inputRef.current.value = ''
          } else {
            // Row errors → download the annotated Excel and notify (replica of legacy behavior).
            if (data.excelWithErrors && data.fileName) downloadErrorExcel(data.excelWithErrors, data.fileName)
            setErrorMessage(t('uploads.sections.error.rowsWithErrors'))
            setErrorOpen(true)
          }
        },
        onError: () => {
          setErrorMessage(t('uploads.sections.error.generic'))
          setErrorOpen(true)
        },
      },
    )
  }

  return (
    <Card title={t('uploads.sections.title')} description={t('uploads.sections.description')}>
      <div className="space-y-5">
        <label
          htmlFor="sections-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-red-400"
        >
          <span className="text-sm font-medium text-gray-700">{file ? file.name : t('uploads.sections.dropzone')}</span>
          <span className="mt-1 text-xs text-gray-400">.xlsx</span>
          <input
            id="sections-file"
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </label>

        {localError && <p className="text-sm text-red-600">{localError}</p>}

        {result?.success && (
          <p className="text-sm text-green-600">
            {t('uploads.sections.loadedSummary')}: {result.loadedRows}/{result.totalRows}
          </p>
        )}

        <div className="flex justify-end">
          <Button variant="primary" onClick={handleUpload} disabled={upload.isPending}>
            {t('uploads.sections.upload')}
          </Button>
        </div>
      </div>

      <LoadingDialog isOpen={upload.isPending} />
      <SuccessDialog isOpen={successOpen} onClose={() => setSuccessOpen(false)} title={t('uploads.sections.successTitle')} message={t('uploads.sections.result.uploadSuccess')} />
      <ErrorDialog isOpen={errorOpen} onClose={() => setErrorOpen(false)} title={t('uploads.sections.errorTitle')} message={errorMessage} />
    </Card>
  )
}
