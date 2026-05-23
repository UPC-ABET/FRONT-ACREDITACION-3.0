'use client'

import { useState, useMemo } from 'react'
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Toggle } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'
import { useI18n } from '@/providers'
import { useSubmitEvaluation } from '../../hooks/use-evaluations'
import type {
  RubricQuestionDetailsResponse,
  ProjectDetailsStudentResponse,
} from '../../api/dtos/response'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(raw: string): string {
  const n = parseFloat(raw)
  if (isNaN(n)) return raw
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function validateScore(
  value: string,
  range: { min: number; max: number },
  msgNaN: string,
  msgRange: string,
): string | undefined {
  if (!value.trim()) return undefined
  const n = parseFloat(value)
  if (isNaN(n)) return msgNaN
  if (n < range.min || n > range.max)
    return `${msgRange} (${fmtNum(String(range.min))} – ${fmtNum(String(range.max))})`
  return undefined
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Scores = Record<number, Record<number, string>> // questionId → studentId → value
type DupScores = Record<number, string>              // questionId → value (duplicate mode)

// ── Main component ────────────────────────────────────────────────────────────

interface ProjectRubricNonCapstoneTableProps {
  questions: RubricQuestionDetailsResponse[]
  students: ProjectDetailsStudentResponse[]
  evaluatorId: number
}

export function ProjectRubricNonCapstoneTable({ questions, students, evaluatorId }: ProjectRubricNonCapstoneTableProps) {
  const { t, locale } = useI18n()
  const { mutate: submitEvaluation, isPending } = useSubmitEvaluation()

  const [duplicateMode, setDuplicateMode] = useState(false)

  // Pre-fill from existing scores in the response
  const initialScores = useMemo<Scores>(() => {
    const result: Scores = {}
    for (const q of questions) {
      result[q.id] = {}
      for (const st of students) {
        let found = ''
        for (const c of q.criterias) {
          const entry = c.scores.find((s) => s.student_id === st.id)
          if (entry) {
            found = String(entry.score)
            break
          }
        }
        result[q.id][st.id] = found
      }
    }
    return result
  }, [questions, students])

  const initialDupScores = useMemo<DupScores>(() => {
    const result: DupScores = {}
    for (const q of questions) result[q.id] = ''
    return result
  }, [questions])

  const [scores, setScores] = useState<Scores>(initialScores)
  const [dupScores, setDupScores] = useState<DupScores>(initialDupScores)

  // Min/max range per question: min of all min_values, max of all max_values
  const ranges = useMemo(() => {
    const result: Record<number, { min: number; max: number }> = {}
    for (const q of questions) {
      const mins = q.criterias.map((c) => parseFloat(c.min_value))
      const maxs = q.criterias.map((c) => parseFloat(c.max_value))
      result[q.id] = { min: Math.min(...mins), max: Math.max(...maxs) }
    }
    return result
  }, [questions])

  const msgNaN = t('projects.evaluate.rubric.errorNaN')
  const msgRange = t('projects.evaluate.rubric.errorRange')

  // All fields filled (no empty values)
  const allFilled = useMemo(() => {
    if (!questions.length) return false
    for (const q of questions) {
      if (duplicateMode) {
        if (!dupScores[q.id]?.trim()) return false
      } else {
        for (const st of students) {
          if (!scores[q.id]?.[st.id]?.trim()) return false
        }
      }
    }
    return true
  }, [questions, students, duplicateMode, scores, dupScores])

  // Any out-of-range / NaN error
  const hasErrors = useMemo(() => {
    for (const q of questions) {
      const range = ranges[q.id] ?? { min: 0, max: 0 }
      const check = (val: string) => !!validateScore(val, range, msgNaN, msgRange)
      if (duplicateMode) {
        if (check(dupScores[q.id] ?? '')) return true
      } else {
        for (const st of students) {
          if (check(scores[q.id]?.[st.id] ?? '')) return true
        }
      }
    }
    return false
  }, [questions, students, duplicateMode, scores, dupScores, ranges, msgNaN, msgRange])

   const canSave = allFilled && !hasErrors

   const handleScore = (qId: number, stId: number, val: string) =>
     setScores((prev) => ({ ...prev, [qId]: { ...prev[qId], [stId]: val } }))

   const handleDupScore = (qId: number, val: string) =>
     setDupScores((prev) => ({ ...prev, [qId]: val }))

    const handleSave = () => {
      // Build a map: studentId → scores[]
      const studentScores = new Map<number, { rubric_question_criteria_id: number; score: number; commentaries: Record<string, string> }[]>();

      for (const q of questions) {
        // For No-Capstone, each question has exactly 1 criterion
        const criterionId = q.criterias[0].id;

        if (duplicateMode) {
          const scoreValue = dupScores[q.id]?.trim();
          if (scoreValue) {
            const parsed = parseFloat(scoreValue);
            for (const st of students) {
              const existing = studentScores.get(st.id) ?? [];
              existing.push({ rubric_question_criteria_id: criterionId, score: parsed, commentaries: {} });
              studentScores.set(st.id, existing);
            }
          }
        } else {
          for (const st of students) {
            const scoreValue = scores[q.id]?.[st.id]?.trim();
            if (scoreValue) {
              const existing = studentScores.get(st.id) ?? [];
              existing.push({ rubric_question_criteria_id: criterionId, score: parseFloat(scoreValue), commentaries: {} });
              studentScores.set(st.id, existing);
            }
          }
        }
      }

      // Submit one request per student with all their scores
      const entries = studentScores.entries();
      for (const [studentId, scores] of entries) {
        submitEvaluation({
          project_student_id: studentId,
          project_evaluator_id: evaluatorId,
          observation: { es: "", en: "" },
          scores,
        });
      }
    }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto w-full">
      <table className="w-full table-auto border-collapse text-sm">
        {/* ── Header ── */}
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50">
            <th className="w-48 min-w-[12rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t('projects.evaluate.rubric.question')}
            </th>
            <th className="min-w-[28rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t('projects.evaluate.rubric.criteria')}
            </th>
            <th className="min-w-[14rem] px-4 py-3 text-left">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {t('projects.evaluate.rubric.score')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">
                    {t('projects.evaluate.rubric.duplicateGrades')}
                  </span>
                  <Toggle checked={duplicateMode} onChange={setDuplicateMode} />
                  <span title={t('projects.evaluate.rubric.duplicateGradesInfo')}>
                    <InformationCircleIcon className="h-4 w-4 cursor-help text-zinc-400" />
                  </span>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        {/* ── Rows ── */}
        <tbody className="divide-y divide-zinc-100">
          {questions.map((q) => {
            const range = ranges[q.id] ?? { min: 0, max: 0 }
            const questionText = q.text[locale as 'es' | 'en'] ?? q.text.es

            return (
              <tr key={q.id} className="align-middle">
                {/* Pregunta */}
                <td className="px-4 py-4">
                  <p className="text-xs leading-snug text-zinc-700">{questionText}</p>
                </td>

                {/* Criterios */}
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    {q.criterias.map((c) => {
                      const minF = fmtNum(c.min_value)
                      const maxF = fmtNum(c.max_value)
                      const desc = c.text[locale as 'es' | 'en'] ?? c.text.es
                      return (
                        <div
                          key={c.id}
                          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600"
                        >
                          <p className="mb-1 font-bold tabular-nums text-zinc-700">
                            {minF} – {maxF}
                          </p>
                          <p className="leading-snug">{desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </td>

                {/* Puntajes */}
                <td className="px-4 py-4 text-center">
                  {duplicateMode ? (
                    <div className="flex justify-center">
                      <ScoreInput
                        value={dupScores[q.id] ?? ''}
                        min={range.min}
                        max={range.max}
                        error={validateScore(dupScores[q.id] ?? '', range, msgNaN, msgRange)}
                        onChange={(val) => handleDupScore(q.id, val)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      {students.map((st) => {
                        const val = scores[q.id]?.[st.id] ?? ''
                        return (
                          <div key={st.id} className="flex items-center gap-2">
                            <span className="min-w-0 truncate text-xs font-medium text-zinc-700">
                              {st.first_name} {st.last_name}
                            </span>
                            <ScoreInput
                              value={val}
                              min={range.min}
                              max={range.max}
                              error={validateScore(val, range, msgNaN, msgRange)}
                              onChange={(v) => handleScore(q.id, st.id, v)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      {/* ── Footer ── */}
      <div className="space-y-3 border-t border-zinc-200 px-6 py-4">
        {/* Validation warnings */}
        <ValidationMessages
          items={[
            ...(!allFilled
              ? [{ message: t('projects.evaluate.rubric.fillAll'), type: 'warning' as const }]
              : []),
            ...(hasErrors
              ? [{ message: t('projects.evaluate.rubric.errorRange'), type: 'error' as const }]
              : []),
          ]}
        />

         <div className="flex justify-end">
           <button
             type="button"
             disabled={!canSave || isPending}
             className={cn(
               'inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
               canSave && !isPending
                 ? 'bg-red-600 text-white hover:bg-red-700'
                 : 'cursor-not-allowed bg-zinc-100 text-zinc-400',
             )}
             onClick={handleSave}
           >
             {isPending ? t('projects.evaluate.rubric.saving') : t('projects.evaluate.rubric.saveButton')}
           </button>
         </div>
      </div>
    </div>
  )
}

// ── Compact score input ───────────────────────────────────────────────────────

interface ScoreInputProps {
  value: string
  min: number
  max: number
  error: string | undefined
  onChange: (val: string) => void
}

function ScoreInput({ value, min, max, error, onChange }: ScoreInputProps) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="—"
      className={cn(
        'w-16 rounded-md border px-2 py-1.5 text-center text-sm tabular-nums outline-none transition-all',
        'bg-white text-zinc-900 placeholder:text-zinc-300',
        error
          ? 'border-red-400 ring-1 ring-red-400/30 focus:border-red-500'
          : 'border-zinc-200 focus:border-red-600 focus:ring-1 focus:ring-red-600/20',
      )}
    />
  )
}

// ── Validation messages (mismo patrón que RubricEditorNonCapstone) ────────────

function ValidationMessages({
  items,
}: {
  items: { message: string; type: 'error' | 'warning' }[]
}) {
  if (!items.length) return null
  return (
    <ul className="space-y-1 text-sm">
      {items.map((item, i) => (
        <li
          key={i}
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2',
            item.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800',
          )}
        >
          <ExclamationTriangleIcon
            className={cn(
              'h-4 w-4 shrink-0',
              item.type === 'error' ? 'text-red-500' : 'text-amber-500',
            )}
          />
          {item.message}
        </li>
      ))}
    </ul>
  )
}
