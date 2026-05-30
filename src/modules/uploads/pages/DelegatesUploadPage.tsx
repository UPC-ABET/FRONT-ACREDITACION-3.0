'use client'

import { useState } from 'react'
import { AcademicPeriodSelect } from '@/modules/academic/components'
import { useI18n } from '@/providers'
import DelegatesUploadForm from '../components/DelegatesUploadForm'

interface PeriodOption { id: number; label: string }
export default function DelegatesUploadPage() {
  const { t } = useI18n()
  const [academicPeriodId, setAcademicPeriodId] = useState<number | null>(null)

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-gray-900">{t('uploads.delegates.pageTitle')}</h1>
        <p className="text-sm text-gray-500">{t('uploads.delegates.pageSubtitle')}</p>
      </div>
      <AcademicPeriodSelect value={academicPeriodId} onChange={setAcademicPeriodId} />
      {academicPeriodId !== null && <DelegatesUploadForm academicPeriodId={academicPeriodId} />}
    </div>
  )
}
