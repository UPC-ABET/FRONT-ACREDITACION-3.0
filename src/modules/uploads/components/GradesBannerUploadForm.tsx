'use client'

import { useRef, useState } from 'react'
import { Card, Button, SuccessDialog, ErrorDialog, LoadingDialog } from '@/shared/components'
import { useI18n } from '@/providers'
import { useGradesBannerUpload, downloadErrorExcel } from '../hooks'
import type { UploadResult } from '../types'

interface GradesBannerUploadFormProps {
  academicPeriodId: number
}

export default function GradesBannerUploadForm({ academicPeriodId }: GradesBannerUploadFormProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [errorOpen, setErrorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const upload = useGradesBannerUpload()

  const handleFileChange = (selected: File | null) => {
    setLocalError(null)
    setResult(null)
    setFile(selected)
  }

  const handleUpload = () => {
    if (!file) { setLocalError(t('uploads.gradesBanner.error.fileRequired')); return }
    if (!academicPeriodId) { setLocalError(t('uploads.gradesBanner.error.periodRequired')); return }
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
            if (data.excelWithErrors && data.fileName) downloadErrorExcel(data.excelWithErrors, data.fileName)
            setErrorMessage(t('uploads.gradesBanner.error.rowsWithErrors'))
            setErrorOpen(true)
          }
        },
        onError: () => { setErrorMessage(t('uploads.gradesBanner.error.generic')); setErrorOpen(true) },
      },
    )
  }

  return (
    <Card title={t('uploads.gradesBanner.title')} description={t('uploads.gradesBanner.description')}>
      <div className="space-y-5">
        <label
          htmlFor="grades-banner-file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center hover:border-red-400"
        >
          <span className="text-sm font-medium text-gray-700">{file ? file.name : t('uploads.gradesBanner.dropzone')}</span>
          <span className="mt-1 text-xs text-gray-400">.xlsx</span>
          <input id="grades-banner-file" ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
        </label>
        {localError && <p className="text-sm text-red-600">{localError}</p>}
        {result?.success && <p className="text-sm text-green-600">{t('uploads.gradesBanner.loadedSummary')}: {result.loadedRows}/{result.totalRows}</p>}
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleUpload} disabled={upload.isPending}>{t('uploads.gradesBanner.upload')}</Button>
        </div>
      </div>
      <LoadingDialog isOpen={upload.isPending} />
      <SuccessDialog isOpen={successOpen} onClose={() => setSuccessOpen(false)} title={t('uploads.gradesBanner.successTitle')} message={t('uploads.gradesBanner.result.uploadSuccess')} />
      <ErrorDialog isOpen={errorOpen} onClose={() => setErrorOpen(false)} title={t('uploads.gradesBanner.errorTitle')} message={errorMessage} />
    </Card>
  )
}
