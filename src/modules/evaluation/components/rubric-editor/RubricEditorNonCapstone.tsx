'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/shared/components/ui'
import { useI18n } from '@/providers'
import { RubricTable } from './RubricTable'
import { rubricsService } from '../../services'
import type { RubricDetail, RubricQuestion, QuestionCriteria } from '../../types'

const TARGET_SUM = 20
const MAX_QUESTIONS = 20
const MAX_COLS = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

function newCriteria(): QuestionCriteria {
  return { id: null, criteriaText: { en: '', es: '' }, minValue: '', maxValue: '' }
}

function buildShape(from: RubricQuestion[] | null | undefined): {
  questions: RubricQuestion[]
  columnCount: number
} {
  const safe = Array.isArray(from) && from.length > 0 ? from : null
  if (!safe) {
    return {
      questions: [{ id: null, order: 1, questionText: { en: '', es: '' }, criteria: [newCriteria()] }],
      columnCount: 1,
    }
  }
  const columnCount = Math.max(1, ...safe.map((q) => q.criteria?.length ?? 0))
  const questions = safe.map((q, i) => ({
    ...q,
    order: q.order || i + 1,
    criteria: [
      ...(Array.isArray(q.criteria) ? q.criteria : []),
      ...Array.from({ length: Math.max(0, columnCount - (q.criteria?.length ?? 0)) }, newCriteria),
    ],
  }))
  return { questions, columnCount }
}

function computeTotal(questions: RubricQuestion[]): number {
  return questions.reduce((sum, q) => {
    const last = q.criteria[q.criteria.length - 1]
    if (!last) return sum
    return sum + (typeof last.maxValue === 'number' ? last.maxValue : 0)
  }, 0)
}

function isContinuousScores(questions: RubricQuestion[]): boolean {
  return questions.every((q) =>
    q.criteria.every((c, ci) => {
      if (ci === 0) return true
      const prev = q.criteria[ci - 1]
      return (
        typeof c.minValue === 'number' &&
        typeof prev.maxValue === 'number' &&
        c.minValue > prev.maxValue
      )
    })
  )
}

function allFilled(questions: RubricQuestion[], locale: 'en' | 'es'): boolean {
  return questions.every(
    (q) =>
      q.questionText[locale].trim().length > 0 &&
      q.criteria.length > 0 &&
      q.criteria.every(
        (c) =>
          c.criteriaText[locale].trim().length > 0 &&
          c.minValue !== '' &&
          c.maxValue !== '' &&
          typeof c.minValue === 'number' &&
          typeof c.maxValue === 'number'
      )
  )
}


// ── ValidationMessages ────────────────────

function ValidationMessages({
  items,
  successMessage,
}: {
  items: { message: string; type: 'error' | 'warning' }[]
  successMessage?: string
}) {
  if (!items.length && successMessage) {
    return (
      <ul className="space-y-1 text-sm">
        <li className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
          <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
          {successMessage}
        </li>
      </ul>
    )
  }
  if (!items.length) return null
  return (
    <ul className="space-y-1 text-sm">
      {items.map((item, i) => (
        <li
          key={i}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 ${item.type === 'error'
            ? 'bg-red-50 text-red-800'
            : 'bg-amber-50 text-amber-800'
            }`}
        >
          <ExclamationTriangleIcon
            className={`h-4 w-4 shrink-0 ${item.type === 'error' ? 'text-red-500' : 'text-amber-500'
              }`}
          />
          {item.message}
        </li>
      ))}
    </ul>
  )
}

// ── RubricEditorNonCapstone ───────────────────────────────────────────────────

interface RubricEditorNonCapstoneProps {
  rubric: RubricDetail
  rubricId: string
  canEdit: boolean
  queryKey: readonly unknown[]
  onNotify: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void
  messages: { autosaveRetry: string; saveSuccess: string }
}

export function RubricEditorNonCapstone({
  rubric,
  rubricId,
  canEdit,
  queryKey,
  onNotify,
  messages,
}: RubricEditorNonCapstoneProps) {
  const { t, locale } = useI18n()
  const queryClient = useQueryClient()

  const [questions, setQuestions] = useState<RubricQuestion[]>(
    () => buildShape(rubric.questions).questions
  )
  const [columnCount, setColumnCount] = useState(
    () => buildShape(rubric.questions).columnCount
  )

  useEffect(() => {
    const { questions: q, columnCount: c } = buildShape(rubric.questions)
    setQuestions(q)
    setColumnCount(c)
  }, [rubric.id])

  const total = useMemo(() => computeTotal(questions), [questions])
  const isFilled = useMemo(() => allFilled(questions, locale), [questions, locale])
  const continuousValid = useMemo(() => isContinuousScores(questions), [questions])
  const sumValid = Math.abs(total - TARGET_SUM) < 0.001
  const rangeValid = useMemo(
    () =>
      questions.every((q) =>
        q.criteria.every(
          (c) =>
            c.minValue === '' ||
            c.maxValue === '' ||
            (typeof c.minValue === 'number' &&
              typeof c.maxValue === 'number' &&
              c.minValue < c.maxValue)
        )
      ),
    [questions]
  )

  const [isSaving, setIsSaving] = useState(false)

  const update = useCallback(
    (next: RubricQuestion[]) => {
      setQuestions(next)
      queryClient.setQueryData<RubricDetail>(queryKey, (prev) =>
        prev ? { ...prev, questions: next } : prev
      )
    },
    [queryClient, queryKey]
  )

  const handleSave = useCallback(async () => {
    if (!canEdit || !isFilled || !continuousValid || !sumValid || !rangeValid) return
    setIsSaving(true)
    try {
      await rubricsService.update(rubricId, {
        questions: questions.map((q) => {
          const qId = q.id && !q.id.startsWith('temp-') ? Number(q.id) : undefined
          return {
            ...(qId !== undefined && { id: qId }),
            question: { es: q.questionText.es, en: q.questionText.en },
            criterias: q.criteria.map((c) => {
              const cId = c.id && !c.id.startsWith('temp-') ? Number(c.id) : undefined
              return {
                ...(cId !== undefined && { id: cId }),
                criteria: { es: c.criteriaText.es, en: c.criteriaText.en },
                min_value: c.minValue as number,
                max_value: c.maxValue as number,
              }
            }),
          }
        }),
      })
      onNotify('success', messages.saveSuccess)
    } catch {
      onNotify('error', t('rubrics.editor.nonCapstone.saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [canEdit, isFilled, continuousValid, sumValid, rangeValid, rubricId, questions, onNotify, messages.saveSuccess, t])

  // ── Question (row) handlers ──────────────────────────────────────────────────

  const handleAddRow = () => {
    if (questions.length >= MAX_QUESTIONS) return
    update([
      ...questions,
      {
        id: `temp-${Date.now()}`,
        order: questions.length + 1,
        questionText: { en: '', es: '' },
        criteria: Array.from({ length: columnCount }, newCriteria),
      },
    ])
  }

  const handleDeleteRow = (rowIndex: number) => {
    update(
      questions
        .filter((_, i) => i !== rowIndex)
        .map((q, i) => ({ ...q, order: i + 1 }))
    )
  }

  const handleQuestionTextChange = (rowIndex: number, text: string) => {
    update(
      questions.map((q, i) =>
        i === rowIndex
          ? { ...q, questionText: { ...q.questionText, [locale]: text } }
          : q
      )
    )
  }

  // ── Criteria (column) handlers ───────────────────────────────────────────────

  const handleAddColumn = () => {
    if (columnCount >= MAX_COLS) return
    setColumnCount((c) => c + 1)
    update(questions.map((q) => ({ ...q, criteria: [...q.criteria, newCriteria()] })))
  }

  const handleDeleteColumn = (colIndex: number) => {
    setColumnCount((c) => Math.max(1, c - 1))
    update(
      questions.map((q) => ({
        ...q,
        criteria: q.criteria.filter((_, ci) => ci !== colIndex),
      }))
    )
  }

  const handleCriteriaTextChange = (rowIndex: number, colIndex: number, text: string) => {
    update(
      questions.map((q, i) =>
        i !== rowIndex
          ? q
          : {
            ...q,
            criteria: q.criteria.map((c, ci) =>
              ci === colIndex
                ? { ...c, criteriaText: { ...c.criteriaText, [locale]: text } }
                : c
            ),
          }
      )
    )
  }

  const handleCriteriaMinChange = (rowIndex: number, colIndex: number, v: number | '') => {
    update(
      questions.map((q, i) =>
        i !== rowIndex
          ? q
          : {
            ...q,
            criteria: q.criteria.map((c, ci) =>
              ci === colIndex ? { ...c, minValue: v } : c
            ),
          }
      )
    )
  }

  const handleCriteriaMaxChange = (rowIndex: number, colIndex: number, v: number | '') => {
    update(
      questions.map((q, i) =>
        i !== rowIndex
          ? q
          : {
            ...q,
            criteria: q.criteria.map((c, ci) =>
              ci === colIndex ? { ...c, maxValue: v } : c
            ),
          }
      )
    )
  }

  // ── Validation messages ──────────────────────────────────────────────────────

  const validationItems = useMemo(() => {
    const items: { message: string; type: 'error' | 'warning' }[] = []

    if (!isFilled)
      items.push({
        message: t('rubrics.editor.nonCapstone.validation.allFieldsRequired'),
        type: 'warning',
      })
    if (!continuousValid)
      items.push({
        message: t('rubrics.editor.nonCapstone.validation.continuityRequired'),
        type: 'error',
      })
    if (!sumValid)
      items.push({
        message: t('rubrics.editor.nonCapstone.validation.totalMustBe20').replace(
          '{{total}}',
          String(total)
        ),
        type: 'error',
      })
    if (!rangeValid)
      items.push({
        message: t('rubrics.editor.nonCapstone.validation.minMustBeLessThanMax'),
        type: 'error',
      })
    return items
  }, [isFilled, continuousValid, sumValid, total, t, rangeValid])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Add criteria button — top-right, outside table */}
      {canEdit ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            disabled={columnCount >= MAX_COLS}
            title={columnCount >= MAX_COLS ? t('rubrics.editor.nonCapstone.tooltips.maxCols') : undefined}
            onClick={handleAddColumn}
          >
            <PlusIcon className="mr-1 h-4 w-4" />
            {t('rubrics.editor.nonCapstone.criteria.addCriteria')}
          </Button>
        </div>
      ) : null}

      <RubricTable
        questions={questions}
        columnCount={columnCount}
        canEdit={canEdit}
        locale={locale}
        questionLabelPrefix={t('rubrics.editor.nonCapstone.question.label')}
        questionPlaceholder={t('rubrics.editor.nonCapstone.question.placeholder')}
        criteriaHeader={t('rubrics.editor.nonCapstone.criteria.label')}
        criteriaPlaceholder={t('rubrics.editor.nonCapstone.criteria.placeholder')}
        minScoreLabel={t('rubrics.editor.nonCapstone.score.minScoreLabel')}
        maxScoreLabel={t('rubrics.editor.nonCapstone.score.maxScoreLabel')}
        onDeleteColumn={handleDeleteColumn}
        onDeleteRow={handleDeleteRow}
        onQuestionTextChange={handleQuestionTextChange}
        onCriteriaTextChange={handleCriteriaTextChange}
        onCriteriaMinChange={handleCriteriaMinChange}
        onCriteriaMaxChange={handleCriteriaMaxChange}
      />

      {canEdit && questions.length < MAX_QUESTIONS ? (
        <Button type="button" variant="primary" onClick={handleAddRow}>
          <PlusIcon className="mr-1 h-4 w-4" />
          {t('rubrics.editor.nonCapstone.question.addQuestion')}
        </Button>
      ) : null}

      <ValidationMessages
        items={validationItems}
        successMessage={
          isFilled && continuousValid && sumValid && rangeValid
            ? t('rubrics.editor.nonCapstone.validation.validationComplete')
            : undefined
        }
      />

      {/* Bottom bar: add question (left) · total score · save (right) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-600">
            {t('rubrics.editor.nonCapstone.totalScore')}:{' '}
            <span
              className={`font-semibold ${sumValid ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {total.toFixed(1)} / {TARGET_SUM.toFixed(1)} {t('rubrics.editor.nonCapstone.points')}
            </span>
          </span>
        </div>

        <Button
          type="button"
          variant="primary"
          disabled={!canEdit || !isFilled || !continuousValid || !sumValid || !rangeValid || isSaving}
          title={
            !isFilled || !continuousValid || !sumValid || !rangeValid
              ? t('rubrics.editor.nonCapstone.tooltips.saveDisabled')
              : undefined
          }
          onClick={() => void handleSave()}
        >
          {isSaving ? t('rubrics.editor.nonCapstone.saving') : t('rubrics.editor.nonCapstone.saveRubric')}
        </Button>
      </div>
    </div>
  )
}
