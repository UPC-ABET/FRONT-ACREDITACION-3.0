'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { CommissionTabs } from './CommissionTabs'
import { CommissionValidator } from './CommissionValidator'
import { OutcomeCard } from './OutcomeCard'
import { QuestionInlineRow } from './QuestionInlineRow'
import { verificationOutcomes } from '../../utils/capstone-utils'
import { PerformanceLevelsSummary } from './PerformanceLevelsSummary'
import { rubricsService } from '../../services'
import { OutcomeQuestion, RubricDetail } from '../../types'

function updateOutcomeQuestions(
  rubric: RubricDetail,
  commissionId: string,
  outcomeId: string,
  updater: (questions: OutcomeQuestion[]) => OutcomeQuestion[]
): RubricDetail {
  return {
    ...rubric,
    commissions: rubric.commissions.map((commission) => {
      if (commission.id !== commissionId) return commission
      const outcomes = commission.outcomes.map((outcome) => {
        if (outcome.id !== outcomeId) return outcome
        return { ...outcome, questions: updater(outcome.questions) }
      })
      const verification = outcomes.filter((o) => o.outcomeType === 'verificacion')
      const isComplete =
        verification.length > 0 &&
        verification.every((o) => o.questions.length > 0)
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
   * one question whose text in the CURRENT locale is non-empty.
   * A commission is "partial" when it has some questions filled but not all outcomes.
   * Save is allowed when at least one commission is complete and none are partial.
   */
  const saveAllowed = useMemo(() => {
    const questionFilled = (q: OutcomeQuestion) => q.questionText[locale].trim().length > 0

    const isComplete = (commission: (typeof draftRubric.commissions)[number]) => {
      const outcomes = verificationOutcomes(commission)
      return (
        outcomes.length > 0 &&
        outcomes.every((o) => o.questions.length > 0 && o.questions.every(questionFilled))
      )
    }

    const hasAnyFilled = (commission: (typeof draftRubric.commissions)[number]) =>
      verificationOutcomes(commission).some((o) => o.questions.some(questionFilled))

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
        verificationOutcomes(commission).flatMap((outcome) =>
          outcome.questions.map((q) => {
            const qId = q.id && !q.id.startsWith('temp-') ? Number(q.id) : undefined
            return {
              ...(qId !== undefined && { id: qId }),
              outcome_id: Number(outcome.id),
              question: { es: q.questionText.es, en: q.questionText.en },
              criterias: [],
            }
          })
        )
      )
      await rubricsService.update(rubricId, { questions })
      onNotify('success', messages.saveSuccess)
    } catch {
      onNotify('error', t('rubrics.editor.error.saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [canEdit, saveAllowed, draftRubric.commissions, rubricId, onNotify, messages.saveSuccess, t])

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleAddQuestion = (commissionId: string, outcomeId: string) => {
    mergeRubric((prev) =>
      updateOutcomeQuestions(prev, commissionId, outcomeId, (questions) => [
        ...questions,
        { id: `temp-${Date.now()}`, questionText: { en: '', es: '' }, criteria: [] },
      ])
    )
  }

  const handlePatchQuestion = async (
    commissionId: string,
    outcomeId: string,
    questionId: string,
    newText: string
  ) => {
    setSavingKey(questionId)
    try {
      mergeRubric((prev) =>
        updateOutcomeQuestions(prev, commissionId, outcomeId, (questions) =>
          questions.map((q) =>
            q.id === questionId
              ? { ...q, questionText: { ...q.questionText, [locale]: newText } }
              : q
          )
        )
      )
    } finally {
      setSavingKey(null)
    }
  }

  const handleCreateQuestion = async (
    commissionId: string,
    outcomeId: string,
    newText: string
  ) => {
    setSavingKey(`${outcomeId}__create`)
    try {
      mergeRubric((prev) =>
        updateOutcomeQuestions(prev, commissionId, outcomeId, (questions) => {
          const tempIndex = questions.findIndex((q) => q.id.startsWith('temp-'))
          const next: OutcomeQuestion = {
            id: `temp-${Date.now()}`,
            questionText: { en: newText, es: newText },
            criteria: [],
          }
          if (tempIndex === -1) return [...questions, next]
          const arr = [...questions]
          arr[tempIndex] = next
          return arr
        })
      )
    } finally {
      setSavingKey(null)
    }
  }

  const handleDeleteQuestion = async (
    commissionId: string,
    outcomeId: string,
    questionId: string
  ) => {
    setSavingKey(questionId)
    try {
      mergeRubric((prev) =>
        updateOutcomeQuestions(prev, commissionId, outcomeId, (questions) =>
          questions.filter((q) => q.id !== questionId)
        )
      )
    } finally {
      setSavingKey(null)
    }
  }

  const handleDeleteQuestionLocal = (
    commissionId: string,
    outcomeId: string,
    questionId: string
  ) => {
    mergeRubric((prev) =>
      updateOutcomeQuestions(prev, commissionId, outcomeId, (questions) =>
        questions.filter((q) => q.id !== questionId)
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
              onAdd={canEdit ? () => handleAddQuestion(activeCommission.id, outcome.id) : undefined}
            >
              {outcome.questions.map((question, index) => (
                <QuestionInlineRow
                  key={question.id}
                  question={question}
                  index={index}
                  canEdit={canEdit}
                  isSaving={
                    savingKey === question.id ||
                    (question.id.startsWith('temp-') && savingKey === `${outcome.id}__create`)
                  }
                  savingLabel={t('rubrics.editor.criteria.saving')}
                  placeholder={t('rubrics.editor.capstone.criteria.criteriaPlaceholder')}
                  labelPrefix={t('rubrics.editor.capstone.criteria.criteriaLabel')}
                  onTextChange={(questionId, text) =>
                    mergeRubric((prev) =>
                      updateOutcomeQuestions(prev, activeCommission.id, outcome.id, (questions) =>
                        questions.map((q) =>
                          q.id === questionId
                            ? { ...q, questionText: { ...q.questionText, [locale]: text } }
                            : q
                        )
                      )
                    )
                  }
                  onPatch={(questionId, text) =>
                    handlePatchQuestion(activeCommission.id, outcome.id, questionId, text)
                  }
                  onCreate={(text) =>
                    handleCreateQuestion(activeCommission.id, outcome.id, text)
                  }
                  onDeletePersisted={(questionId) =>
                    handleDeleteQuestion(activeCommission.id, outcome.id, questionId)
                  }
                  onDeleteLocal={(questionId) =>
                    handleDeleteQuestionLocal(activeCommission.id, outcome.id, questionId)
                  }
                  onNotifyRetry={() => onNotify('warning', messages.autosaveRetry)}
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
