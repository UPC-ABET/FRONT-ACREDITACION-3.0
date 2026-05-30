'use client'

import { useState } from 'react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Select } from '@/shared/components'
import { useI18n } from '@/providers'
import { useCreatePeriod } from '../hooks'
import { MODALITY_LABEL_KEYS } from '../constants'
import { PERIOD_CODE_PATTERN, PERIOD_MODALITY_CODES } from '../types'
import type { PeriodModalityCode } from '../types'

interface NewPeriodDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (periodId: number) => void
}

// Modal "Nuevo Ciclo" (blueprint §4.1 componente 1):
// - máscara YYYY-01/02/00
// - DatePickers coordinados (end >= start)
// - Radio Regular/EPE
export default function NewPeriodDialog({ open, onClose, onCreated }: NewPeriodDialogProps) {
  const { t } = useI18n()
  const create = useCreatePeriod()
  const [code, setCode] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [modalityCode, setModalityCode] = useState<PeriodModalityCode>('REGULAR')
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setCode('')
    setStartDate('')
    setEndDate('')
    setModalityCode('REGULAR')
    setError(null)
  }

  const handleSubmit = () => {
    setError(null)

    if (!PERIOD_CODE_PATTERN.test(code)) {
      setError(t('configuration.period.error.codeFormat'))
      return
    }
    if (!startDate || !endDate) {
      setError(t('configuration.period.error.datesRequired'))
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError(t('configuration.period.error.endBeforeStart'))
      return
    }

    create.mutate(
      { code, start_date: startDate, end_date: endDate, modality_code: modalityCode },
      {
        onSuccess: (data) => {
          reset()
          onClose()
          onCreated(data.id)
        },
        onError: (err) => setError(err.message || t('configuration.period.error.generic')),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('configuration.period.dialogTitle')}</DialogTitle>
        </DialogHeader>
      <div className="space-y-4">
        <div>
          <label htmlFor="period-code" className="mb-1 block text-xs font-medium text-gray-600">
            {t('configuration.period.codeLabel')}
          </label>
          <Input
            id="period-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="2026-01"
          />
          <p className="mt-1 text-xs text-gray-400">{t('configuration.period.codeHint')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="period-start" className="mb-1 block text-xs font-medium text-gray-600">
              {t('configuration.period.startLabel')}
            </label>
            <Input id="period-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || undefined} />
          </div>
          <div>
            <label htmlFor="period-end" className="mb-1 block text-xs font-medium text-gray-600">
              {t('configuration.period.endLabel')}
            </label>
            <Input id="period-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} />
          </div>
        </div>

        <div>
          <label htmlFor="period-modality" className="mb-1 block text-xs font-medium text-gray-600">
            {t('configuration.period.modalityLabel')}
          </label>
          <Select
            name="period-modality"
            value={{ value: modalityCode, label: t(MODALITY_LABEL_KEYS[modalityCode]) }}
            onChange={(_name, opt) => {
              const v = Array.isArray(opt) ? opt[0] : opt
              if (v) setModalityCode(String(v.value) as PeriodModalityCode)
            }}
            options={PERIOD_MODALITY_CODES.map((c) => ({ value: c, label: t(MODALITY_LABEL_KEYS[c]) }))}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            {t('configuration.period.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending}>
            {create.isPending ? t('configuration.period.creating') : t('configuration.period.create')}
          </Button>
        </div>
      </div>
      </DialogContent>
    </Dialog>
  )
}
