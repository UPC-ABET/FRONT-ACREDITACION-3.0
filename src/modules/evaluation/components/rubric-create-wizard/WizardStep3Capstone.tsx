'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrashIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { Button, Input, Skeleton } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { CommissionTabs } from '../rubric-editor/CommissionTabs'
import { OutcomeCard } from '../rubric-editor/OutcomeCard'
import { rubricWizardService } from '../../services/rubricWizardService'
import type { CommissionTab, OutcomeWithCriteria, CriteriaItem } from '../../types'
import type { OutcomeResponse } from '../../api/dtos'
import type { Step1Data } from './WizardStep1'
import type { Step2Data } from './WizardStep2'

export interface CapstonePayloadQuestion {
  outcome_id: number
  question: { es: string; en: string }
  criterias: { criteria: { es: string; en: string }; min_value: number; max_value: number }[]
}

interface LocalCriteria {
  id: string
  text: { en: string; es: string }
}

interface LocalOutcome {
  outcomeId: number
  outcomeCode: string
  outcomeName: { en: string; es: string }
  commissionId: string
  criteria: LocalCriteria[]
}

interface WizardStep3CapstoneProps {
  step1: Step1Data
  step2: Step2Data
  onBack: () => void
  onSubmit: (questions: CapstonePayloadQuestion[]) => Promise<void>
  isSubmitting: boolean
}

function newLocalCriteria(): LocalCriteria {
  return { id: `temp-${Date.now()}-${Math.random()}`, text: { en: '', es: '' } }
}


export function WizardStep3Capstone({
  step1,
  step2,
  onBack,
  onSubmit,
  isSubmitting,
}: WizardStep3CapstoneProps) {
  const { t, locale } = useI18n()
  const [outcomes, setOutcomes] = useState<LocalOutcome[]>([])
  const [activeCommissionId, setActiveCommissionId] = useState('')
  const [loadingOutcomes, setLoadingOutcomes] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (step2.capstoneOutcomeIds.length === 0) {
      setLoadingOutcomes(false)
      return
    }
    Promise.all(step2.capstoneOutcomeIds.map((id) => rubricWizardService.getOutcomeById(id)))
      .then((responses) => {
        const loaded: LocalOutcome[] = responses.map((r) => {
          const o: OutcomeResponse = r.data
          const commission = o.program_commission?.commission
          const commissionId = String(o.program_commission?.id ?? o.program_commission_id ?? 'sin-comision')
          return {
            outcomeId: o.id,
            outcomeCode: o.outcome_code,
            outcomeName: o.outcome_name,
            commissionId,
            // Patch commission display code/name for tabs after building
            _commission: commission,
            criteria: [newLocalCriteria()],
          } as LocalOutcome & { _commission: typeof commission }
        })

        // Build outcome list with enriched commission labels
        const enriched: LocalOutcome[] = loaded.map((o: any) => {
          const c = o._commission
          if (c) {
            return { ...o, commissionId: String(c.id), _commissionMeta: { code: c.code, name: c.name } }
          }
          return o
        })

        setOutcomes(enriched)

        // Activate first commission
        const firstId = enriched[0]?.commissionId ?? ''
        setActiveCommissionId(firstId)
      })
      .catch(() => setLoadError(t('rubrics.wizard.step3.capstone.error.loadOutcomes')))
      .finally(() => setLoadingOutcomes(false))
  }, [step2.capstoneOutcomeIds])

  const commissionTabs = useMemo(() => {
    const map = new Map<string, { code: string; name: { en: string; es: string }; outcomes: LocalOutcome[] }>()

    for (const o of outcomes) {
      const meta = (o as any)._commissionMeta
      if (!map.has(o.commissionId)) {
        map.set(o.commissionId, {
          code: meta?.code ?? o.commissionId,
          name: meta?.name ?? { en: o.commissionId, es: o.commissionId },
          outcomes: [],
        })
      }
      map.get(o.commissionId)!.outcomes.push(o)
    }

    return Array.from(map.entries()).map(([id, { code, name, outcomes: cos }]) => ({
      id,
      code,
      name,
      accreditorCode: '',
      isComplete: cos.every(
        (o) => o.criteria.length > 0 && o.criteria.every((c) => c.text[locale].trim().length > 0)
      ),
      outcomes: cos.map<OutcomeWithCriteria>((o) => ({
        id: String(o.outcomeId),
        outcomeCode: o.outcomeCode,
        outcomeDescription: o.outcomeName,
        outcomeType: 'verificacion',
        questions: [
          {
            id: String(o.outcomeId),
            questionText: o.outcomeName,
            criteria: o.criteria.map<CriteriaItem>((c) => ({
              id: c.id,
              description: c.text,
              minValue: 0,
              maxValue: 0,
            })),
          },
        ],
      })),
    }))
  }, [outcomes, locale])

  const activeCommission = commissionTabs.find((c) => c.id === activeCommissionId)

  const allFilled = useMemo(
    () =>
      outcomes.length > 0 &&
      outcomes.every(
        (o) => o.criteria.length > 0 && o.criteria.every((c) => c.text[locale].trim().length > 0)
      ),
    [outcomes, locale]
  )

  const updateOutcome = (outcomeId: number, updater: (o: LocalOutcome) => LocalOutcome) =>
    setOutcomes((prev) => prev.map((o) => (o.outcomeId === outcomeId ? updater(o) : o)))

  const addCriteria = (outcomeId: number) =>
    updateOutcome(outcomeId, (o) => ({ ...o, criteria: [...o.criteria, newLocalCriteria()] }))

  const deleteCriteria = (outcomeId: number, ci: number) =>
    updateOutcome(outcomeId, (o) => ({ ...o, criteria: o.criteria.filter((_, i) => i !== ci) }))

  const setCriteriaText = (outcomeId: number, ci: number, text: string) =>
    updateOutcome(outcomeId, (o) => ({
      ...o,
      criteria: o.criteria.map((c, i) =>
        i === ci ? { ...c, text: { ...c.text, [locale]: text } } : c
      ),
    }))

  const handleSubmit = async () => {
    if (!allFilled) return
    await onSubmit(
      outcomes.map((o) => ({
        outcome_id: o.outcomeId,
        question: { es: o.outcomeName.es, en: o.outcomeName.en },
        criterias: o.criteria.map((c) => ({
          criteria: { es: c.text.es, en: c.text.en },
          min_value: 0,
          max_value: 0,
        })),
      }))
    )
  }

  if (loadingOutcomes) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    )
  }

  if (loadError) {
    return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</p>
  }

  return (
    <div className="space-y-6">
      {/* Commission tabs — mismo componente que el editor */}
      {commissionTabs.length > 0 && (
        <CommissionTabs
          commissions={commissionTabs}
          activeCommissionId={activeCommissionId}
          onCommissionChange={setActiveCommissionId}
          checkboxTooltipIncomplete={t('rubrics.wizard.step3.capstone.commissionTooltipIncomplete')}
        />
      )}

      {/* Outcomes de la comisión activa */}
      <div className="space-y-4">
        {(activeCommission?.outcomes ?? commissionTabs[0]?.outcomes ?? []).map((outcomeView) => {
          const outcomeId = Number(outcomeView.id)
          const localOutcome = outcomes.find((o) => o.outcomeId === outcomeId)!
          if (!localOutcome) return null

          return (
            <OutcomeCard
              key={outcomeId}
              outcome={outcomeView}
              canEdit={true}
              emptyMessage={t('rubrics.wizard.step3.capstone.emptyOutcome')}
              emptyMessageWithHint={t('rubrics.wizard.step3.capstone.emptyOutcomeHint')}
              onAdd={() => addCriteria(outcomeId)}
            >
              {localOutcome.criteria.map((c, ci) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2"
                >
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {t('rubrics.wizard.step3.capstone.criteriaLabel')} {ci + 1}
                  </span>
                  <div className="min-w-[12rem] flex-1">
                    <Input
                      value={c.text[locale]}
                      placeholder={t('rubrics.wizard.step3.capstone.criteriaPlaceholder')}
                      onChange={(e) => setCriteriaText(outcomeId, ci, e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={localOutcome.criteria.length === 1}
                    onClick={() => deleteCriteria(outcomeId, ci)}
                  >
                    <TrashIcon className="h-5 w-5 text-zinc-500" aria-hidden />
                    <span className="sr-only">{t('rubrics.wizard.step3.capstone.deleteCriteria')}</span>
                  </Button>
                </div>
              ))}
            </OutcomeCard>
          )
        })}
      </div>

      {/* Validación */}
      {!allFilled && outcomes.length > 0 && (
        <ul className="space-y-1 text-sm">
          <li className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
            <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
            {t('rubrics.wizard.step3.capstone.validation.incomplete')}
          </li>
        </ul>
      )}

      {allFilled && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
          {t('rubrics.wizard.step3.capstone.validation.complete')}
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting}>
          {t('rubrics.wizard.step3.back')}
        </Button>
        <Button variant="primary" disabled={!allFilled || isSubmitting} onClick={() => void handleSubmit()}>
          {isSubmitting ? t('rubrics.wizard.step3.submitting') : t('rubrics.wizard.step3.submit')}
        </Button>
      </div>
    </div>
  )
}
