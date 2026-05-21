'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { CommissionTabs } from './CommissionTabs'
import { CommissionValidator } from './CommissionValidator'
import { CriteriaInlineRow } from './CriteriaInlineRow'
import { OutcomeCard } from './OutcomeCard'
import { verificationOutcomes } from '../../utils/capstone-utils'
import { PerformanceLevelsSummary } from './PerformanceLevelsSummary'
import { rubricsService } from '../../services'
import { CriteriaItem, RubricDetail } from '../../types'

function updateOutcomeCriteria(
  rubric: RubricDetail,
  commissionId: string,
  outcomeId: string,
  updater: (criteria: CriteriaItem[]) => CriteriaItem[]
): RubricDetail {
  return {
    ...rubric,
    commissions: rubric.commissions.map((commission) => {
      if (commission.id !== commissionId) return commission
      const outcomes = commission.outcomes.map((outcome) => {
        if (outcome.id !== outcomeId) return outcome
        const q = outcome.questions[0]
        if (!q) return outcome
        return { ...outcome, questions: [{ ...q, criteria: updater(q.criteria) }] }
      })
      const verification = outcomes.filter((o) => o.outcomeType === 'verificacion')
      const isComplete =
        verification.length > 0 &&
        verification.every((o) => (o.questions[0]?.criteria.length ?? 0) > 0)
      return { ...commission, outcomes, isComplete }
    }),
  }
}

interface RubricEditorCapstoneProps {
  rubric: RubricDetail
  rubricId: string
  canEdit: boolean
  queryKey: readonly unknown[]
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void
  messages: {
    autosaveRetry: string
    saveSuccess: string
  }
}

export function RubricEditorCapstone({ rubric, rubricId, canEdit, queryKey, onNotify, messages }: RubricEditorCapstoneProps) {
  const { t, locale } = useI18n()
  const queryClient = useQueryClient()
  const [activeCommissionId, setActiveCommissionId] = useState(() => rubric.commissions[0]?.id ?? '')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [draftRubric, setDraftRubric] = useState<RubricDetail>(rubric)

  const activeCommission = useMemo(
    () => draftRubric.commissions.find((c) => c.id === activeCommissionId),
    [draftRubric.commissions, activeCommissionId]
  )

  /**
   * Locale-aware save validation.
   * A commission is "complete" when every verification outcome has at least
   * one criteria whose text in the CURRENT locale is non-empty.
   * Save is allowed when at least one commission is complete and none are partial.
   */
  const saveAllowed = useMemo(() => {
    const criteriaFilled = (c: CriteriaItem) => c.description[locale].trim().length > 0

    const outcomeComplete = (outcome: (typeof draftRubric.commissions)[number]['outcomes'][number]) => {
      const q = outcome.questions[0]
      return q !== undefined && q.criteria.length > 0 && q.criteria.every(criteriaFilled)
    }

    const isComplete = (commission: (typeof draftRubric.commissions)[number]) => {
      const outcomes = verificationOutcomes(commission)
      return outcomes.length > 0 && outcomes.every(outcomeComplete)
    }

    const hasAnyFilled = (commission: (typeof draftRubric.commissions)[number]) =>
      verificationOutcomes(commission).some((o) => {
        const q = o.questions[0]
        return q !== undefined && q.criteria.some(criteriaFilled)
      })

    const isPartial = (commission: (typeof draftRubric.commissions)[number]) =>
      hasAnyFilled(commission) && !isComplete(commission)

    const hasComplete = draftRubric.commissions.some(isComplete)
    const hasPartial = draftRubric.commissions.some(isPartial)
    return hasComplete && !hasPartial
  }, [draftRubric.commissions, locale])

  const [isSaving, setIsSaving] = useState(false)

  const mergeRubric = (fn: (prev: RubricDetail) => RubricDetail) => {
    setDraftRubric((prev) => fn(prev))
    queryClient.setQueryData<RubricDetail>(queryKey, (prev) => (prev ? fn(prev) : prev))
  }

  const handleSave = useCallback(async () => {
    if (!canEdit || !saveAllowed) return
    setIsSaving(true)
    try {
      const questions = draftRubric.commissions.flatMap((commission) =>
        verificationOutcomes(commission).map((outcome) => {
          const q = outcome.questions[0]
          const qId = q && !q.id.startsWith('temp-') ? Number(q.id) : undefined
          return {
            ...(qId !== undefined && { id: qId }),
            outcome_id: Number(outcome.id),
            question: { es: outcome.outcomeDescription.es, en: outcome.outcomeDescription.en },
            criterias: (q?.criteria ?? []).map((c) => {
              const cId = !c.id.startsWith('temp-') ? Number(c.id) : undefined
              return {
                ...(cId !== undefined && { id: cId }),
                criteria: { es: c.description.es, en: c.description.en },
                min_value: 0,
                max_value: 0,
              }
            }),
          }
        })
      )
      await rubricsService.update(rubricId, { questions })
      onNotify('success', messages.saveSuccess)
    } catch {
      onNotify('error', t('rubrics.editor.capstone.saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [canEdit, saveAllowed, draftRubric.commissions, rubricId, onNotify, messages.saveSuccess, t])

  // ── criteria handlers ────────────────────────────────────────────────────────

  const handleAddCriteria = (commissionId: string, outcomeId: string) => {
    mergeRubric((prev) =>
      updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) => [
        ...criteria,
        { id: `temp-${Date.now()}`, description: { en: '', es: '' }, minValue: 0, maxValue: 0 },
      ])
    )
  }

  const handlePatchCriteria = async (
    commissionId: string,
    outcomeId: string,
    criteriaId: string,
    text: string
  ) => {
    setSavingKey(criteriaId)
    try {
      mergeRubric((prev) =>
        updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) =>
          criteria.map((c) =>
            c.id === criteriaId
              ? { ...c, description: { ...c.description, [locale]: text } }
              : c
          )
        )
      )
    } finally {
      setSavingKey(null)
    }
  }

  const handleCreateCriteria = async (
    commissionId: string,
    outcomeId: string,
    text: string
  ) => {
    setSavingKey(`${outcomeId}__create`)
    try {
      mergeRubric((prev) =>
        updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) => {
          const tempIndex = criteria.findIndex((c) => c.id.startsWith('temp-'))
          const next: CriteriaItem = {
            id: `temp-${Date.now()}`,
            description: { en: text, es: text },
            minValue: 0,
            maxValue: 0,
          }
          if (tempIndex === -1) return [...criteria, next]
          const arr = [...criteria]
          arr[tempIndex] = next
          return arr
        })
      )
    } finally {
      setSavingKey(null)
    }
  }

  const handleDeleteCriteria = async (
    commissionId: string,
    outcomeId: string,
    criteriaId: string
  ) => {
    setSavingKey(criteriaId)
    try {
      mergeRubric((prev) =>
        updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) =>
          criteria.filter((c) => c.id !== criteriaId)
        )
      )
    } finally {
      setSavingKey(null)
    }
  }

  const handleDeleteCriteriaLocal = (
    commissionId: string,
    outcomeId: string,
    criteriaId: string
  ) => {
    mergeRubric((prev) =>
      updateOutcomeCriteria(prev, commissionId, outcomeId, (criteria) =>
        criteria.filter((c) => c.id !== criteriaId)
      )
    )
  }

  // ── render ──────────────────────────────────────────────────────────────────

  if (!rubric.commissions.length) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t('rubrics.editor.capstone.noCommissions')}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <CommissionTabs
        commissions={draftRubric.commissions}
        activeCommissionId={activeCommissionId}
        onCommissionChange={setActiveCommissionId}
        checkboxTooltipIncomplete={t('rubrics.editor.capstone.tooltips.commissionCheckboxIncomplete')}
      />

      <PerformanceLevelsSummary levels={rubric.performanceLevels} />

      {activeCommission ? (
        <div className="space-y-4">
          {verificationOutcomes(activeCommission).map((outcome) => (
            <OutcomeCard
              key={outcome.id}
              outcome={outcome}
              canEdit={canEdit}
              emptyMessage={t('rubrics.editor.capstone.validation.emptyOutcomeReadonly')}
              emptyMessageWithHint={t('rubrics.editor.capstone.validation.emptyOutcome')}
              onAdd={canEdit ? () => handleAddCriteria(activeCommission.id, outcome.id) : undefined}
            >
              {(outcome.questions[0]?.criteria ?? []).map((criterion, index) => (
                <CriteriaInlineRow
                  key={criterion.id}
                  criterion={criterion}
                  index={index}
                  canEdit={canEdit}
                  isSaving={
                    savingKey === criterion.id ||
                    (criterion.id.startsWith('temp-') && savingKey === `${outcome.id}__create`)
                  }
                  savingLabel={t('rubrics.editor.criteria.saving')}
                  placeholder={t('rubrics.editor.capstone.criteria.criteriaPlaceholder')}
                  criteriaLabelPrefix={t('rubrics.editor.capstone.criteria.criteriaLabel')}
                  onTextChange={(criteriaId, text) =>
                    mergeRubric((prev) =>
                      updateOutcomeCriteria(prev, activeCommission.id, outcome.id, (criteria) =>
                        criteria.map((c) =>
                          c.id === criteriaId
                            ? { ...c, description: { ...c.description, [locale]: text } }
                            : c
                        )
                      )
                    )
                  }
                  onPatch={(criteriaId, text) =>
                    handlePatchCriteria(activeCommission.id, outcome.id, criteriaId, text)
                  }
                  onCreate={(text) =>
                    handleCreateCriteria(activeCommission.id, outcome.id, text)
                  }
                  onDeletePersisted={(criteriaId) =>
                    handleDeleteCriteria(activeCommission.id, outcome.id, criteriaId)
                  }
                  onDeleteLocal={(criteriaId) =>
                    handleDeleteCriteriaLocal(activeCommission.id, outcome.id, criteriaId)
                  }
                  onNotifyRetry={() => onNotify('warning', messages.autosaveRetry)}
                  onConfirmDelete={() => window.confirm(t('rubrics.editor.capstone.criteria.confirmDelete'))}
                />
              ))}
            </OutcomeCard>
          ))}
        </div>
      ) : null}

      <CommissionValidator
        commissions={draftRubric.commissions}
        locale={locale}
        labelComplete={t('rubrics.editor.capstone.validation.validationComplete')}
        labelIncomplete={t('rubrics.editor.capstone.validation.validationIncomplete')}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          disabled={!canEdit || !saveAllowed || isSaving}
          title={!saveAllowed ? t('rubrics.editor.capstone.tooltips.saveDisabled') : undefined}
          onClick={() => void handleSave()}
        >
          {isSaving ? t('rubrics.editor.capstone.saving') : t('rubrics.editor.capstone.saveRubric')}
        </Button>
      </div>
    </div>
  )
}
