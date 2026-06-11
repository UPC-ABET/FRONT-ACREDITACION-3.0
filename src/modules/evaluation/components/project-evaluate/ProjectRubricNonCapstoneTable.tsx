'use client';

import { useState, useMemo, useEffect, JSX } from 'react';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { useSubmitEvaluation } from '../../hooks/useEvaluations';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '../../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(raw: string): string {
	const n = parseFloat(raw);
	if (isNaN(n)) return raw;
	return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function validateScore(
	value: string,
	range: { min: number; max: number },
	msgNaN: string,
	msgRange: string,
): string | undefined {
	if (!value.trim()) return undefined;
	const n = parseFloat(value);
	if (isNaN(n)) return msgNaN;
	if (n < range.min || n > range.max)
		return `${msgRange} (${fmtNum(String(range.min))} – ${fmtNum(String(range.max))})`;
	return undefined;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Scores = Record<number, Record<number, string>>;
type DupScores = Record<number, string>;

type CriteriaScoreEntry = {
	rubricQuestionCriteriaId: number;
	score: number;
	commentaries: Record<string, string>;
};

// ── Main component ────────────────────────────────────────────────────────────

interface ProjectRubricNonCapstoneTableProps {
	questions: RubricQuestionDetailsResponse[];
	students: ProjectDetailsStudentResponse[];
	evaluatorId: number;
	rubricId: number;
	projectId: string | number;
	qualifStatuses: Record<number, number | null>;
	nrNaTypeIds: Set<number>;
}

export function ProjectRubricNonCapstoneTable({
	questions,
	students,
	evaluatorId,
	rubricId,
	projectId,
	qualifStatuses,
	nrNaTypeIds,
}: ProjectRubricNonCapstoneTableProps) {
	const { t, locale } = useI18n();
	const { mutate: submitEvaluation, isPending } = useSubmitEvaluation(projectId);

	const [duplicateMode, setDuplicateMode] = useState(false);

	// ── Pre-fill from existing scores ─────────────────────────────────────────
	// Business rule: only ONE criteria per question will ever carry scores.
	// Find that criteria first, then read each student's entry from it.

	const initialScores = useMemo<Scores>(() => {
		const result: Scores = {};

		for (const q of questions) {
			result[q.id] = {};

			students.forEach((st, stIdx) => {
				// Each student has at most one graded criteria — search across all of them
				let found = '';
				for (const c of q.criterias) {
					const entry = c.scores?.find(
						(s) => s.studentId === st.id && s.evaluatorId === evaluatorId,
					);
					if (entry != null) {
						found = String(entry.score);
						break;
					}
				}
				result[q.id][stIdx] = found;
			});
		}

		return result;
	}, [questions, students, evaluatorId]);

	const initialDupScores = useMemo<DupScores>(() => {
		const result: DupScores = {};
		for (const q of questions) result[q.id] = '';
		return result;
	}, [questions]);

	const [scores, setScores] = useState<Scores>(initialScores);
	const [dupScores, setDupScores] = useState<DupScores>(initialDupScores);

	useEffect(() => {
		setScores(initialScores);
	}, [initialScores]);

	// ── Ranges per question ───────────────────────────────────────────────────

	const ranges = useMemo(() => {
		const result: Record<number, { min: number; max: number }> = {};
		for (const q of questions) {
			const mins = q.criterias.map((c) => parseFloat(c.minValue));
			const maxs = q.criterias.map((c) => parseFloat(c.maxValue));
			result[q.id] = { min: Math.min(...mins), max: Math.max(...maxs) };
		}
		return result;
	}, [questions]);

	const msgNaN = t('projects.evaluate.rubric.errorNaN');
	const msgRange = t('projects.evaluate.rubric.errorRange');

	// ── Derived state ─────────────────────────────────────────────────────────

	const allFilled = useMemo(() => {
		if (!questions.length) return false;
		for (const st of students) {
			if (qualifStatuses[st.id] == null) return false;
		}
		const hasGraded = students.some((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1));
		for (const q of questions) {
			if (duplicateMode) {
				if (hasGraded && !dupScores[q.id]?.trim()) return false;
			} else {
				for (let stIdx = 0; stIdx < students.length; stIdx++) {
					if (nrNaTypeIds.has(qualifStatuses[students[stIdx].id] ?? -1)) continue;
					if (!scores[q.id]?.[stIdx]?.trim()) return false;
				}
			}
		}
		return true;
	}, [questions, students, duplicateMode, scores, dupScores, qualifStatuses, nrNaTypeIds]);

	const hasErrors = useMemo(() => {
		for (const q of questions) {
			const range = ranges[q.id] ?? { min: 0, max: 0 };
			const check = (val: string) => !!validateScore(val, range, msgNaN, msgRange);
			if (duplicateMode) {
				if (check(dupScores[q.id] ?? '')) return true;
			} else {
				for (let stIdx = 0; stIdx < students.length; stIdx++) {
					if (check(scores[q.id]?.[stIdx] ?? '')) return true;
				}
			}
		}
		return false;
	}, [questions, students.length, duplicateMode, scores, dupScores, ranges, msgNaN, msgRange]);

	const canSave = allFilled && !hasErrors;

	// ── Handlers ──────────────────────────────────────────────────────────────

	const handleScore = (qId: number, stIdx: number, val: string): void =>
		setScores((prev) => ({ ...prev, [qId]: { ...prev[qId], [stIdx]: val } }));

	const handleDupScore = (qId: number, val: string): void =>
		setDupScores((prev) => ({ ...prev, [qId]: val }));

	// Returns the criteria whose [min, max] range contains the given score (inclusive).
	const findMatchingCriteria = (q: RubricQuestionDetailsResponse, score: number) =>
		q.criterias.find((c) => {
			const min = parseFloat(c.minValue);
			const max = parseFloat(c.maxValue);
			return score >= min && score <= max;
		});

	const handleSave = (): void => {
		const studentPayloads = new Map<number, CriteriaScoreEntry[]>();

		for (const q of questions) {
			// Lowest-range criteria used for NR/NA students (score 0)
			const lowestCriteria = q.criterias.reduce((a, b) =>
				parseFloat(a.minValue) <= parseFloat(b.minValue) ? a : b,
			);

			if (duplicateMode) {
				const raw = dupScores[q.id]?.trim();
				const dupScore = raw ? parseFloat(raw) : NaN;
				const matchedCriteria = !isNaN(dupScore) ? findMatchingCriteria(q, dupScore) : undefined;

				for (const st of students) {
					const isNrNa = nrNaTypeIds.has(qualifStatuses[st.id] ?? -1);
					const existing: CriteriaScoreEntry[] = studentPayloads.get(st.id) ?? [];
					if (isNrNa) {
						existing.push({
							rubricQuestionCriteriaId: lowestCriteria.id,
							score: 0,
							commentaries: {},
						});
					} else {
						if (!matchedCriteria || isNaN(dupScore)) continue;
						existing.push({
							rubricQuestionCriteriaId: matchedCriteria.id,
							score: dupScore,
							commentaries: {},
						});
					}
					studentPayloads.set(st.id, existing);
				}
			} else {
				students.forEach((st, stIdx) => {
					const isNrNa = nrNaTypeIds.has(qualifStatuses[st.id] ?? -1);
					const existing: CriteriaScoreEntry[] = studentPayloads.get(st.id) ?? [];
					if (isNrNa) {
						existing.push({
							rubricQuestionCriteriaId: lowestCriteria.id,
							score: 0,
							commentaries: {},
						});
					} else {
						const raw = scores[q.id]?.[stIdx]?.trim();
						if (!raw) return;
						const score = parseFloat(raw);
						if (isNaN(score)) return;
						const matchedCriteria = findMatchingCriteria(q, score);
						if (!matchedCriteria) return;
						existing.push({
							rubricQuestionCriteriaId: matchedCriteria.id,
							score,
							commentaries: {},
						});
					}
					studentPayloads.set(st.id, existing);
				});
			}
		}

		// Submit one request per student; skip students with no scored criteria
		for (const [projectStudentId, criteriaScores] of studentPayloads.entries()) {
			if (!criteriaScores.length) continue;

			submitEvaluation({
				projectStudentId,
				projectEvaluatorId: evaluatorId,
				rubricId: rubricId,
				observation: { es: '', en: '' },
				scores: criteriaScores,
				qualificationStatusTypeId: qualifStatuses[projectStudentId],
			});
		}
	};

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
			<div className="w-full overflow-x-auto">
				<table className="w-full table-auto border-collapse text-sm">
					{/* Header */}
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

					{/* Rows */}
					<tbody className="divide-y divide-zinc-100">
						{questions.map((q) => {
							const range = ranges[q.id] ?? { min: 0, max: 0 };
							const questionText = q.text[locale as 'es' | 'en'] ?? q.text.es;

							return (
								<tr key={q.id} className="align-middle">
									{/* Question */}
									<td className="px-4 py-4">
										<p className="text-xs leading-snug text-zinc-700">{questionText}</p>
									</td>

									{/* Criteria */}
									<td className="px-4 py-4">
										<div className="flex gap-2">
											{q.criterias.map((c) => {
												const minF = fmtNum(c.minValue);
												const maxF = fmtNum(c.maxValue);
												const desc = c.text[locale as 'es' | 'en'] ?? c.text.es;
												return (
													<div
														key={c.id}
														className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600">
														<p className="mb-1 font-bold tabular-nums text-zinc-700">
															{minF} – {maxF}
														</p>
														<p className="leading-snug">{desc}</p>
													</div>
												);
											})}
										</div>
									</td>

									{/* Scores */}
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
												{students
													.map((st, stIdx) => ({ st, stIdx }))
													.filter(({ st }) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1))
													.map(({ st, stIdx }) => {
														const val = scores[q.id]?.[stIdx] ?? '';
														return (
															<div key={stIdx} className="flex items-center gap-2">
																<span className="min-w-0 truncate text-xs font-medium text-zinc-700">
																	{st.firstName} {st.lastName}
																</span>
																<ScoreInput
																	value={val}
																	min={range.min}
																	max={range.max}
																	error={validateScore(val, range, msgNaN, msgRange)}
																	onChange={(v) => handleScore(q.id, stIdx, v)}
																/>
															</div>
														);
													})}
											</div>
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Footer */}
			<div className="space-y-3 border-t border-zinc-200 px-6 py-4">
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
						onClick={handleSave}
						className={cn(
							'inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
							canSave && !isPending
								? 'bg-red-600 text-white hover:bg-red-700'
								: 'cursor-not-allowed bg-zinc-100 text-zinc-400',
						)}>
						{isPending
							? t('projects.evaluate.rubric.saving')
							: t('projects.evaluate.rubric.saveButton')}
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Compact score input ───────────────────────────────────────────────────────

interface ScoreInputProps {
	value: string;
	min: number;
	max: number;
	error: string | undefined;
	onChange: (val: string) => void;
}

function ScoreInput({ value, min, max, error, onChange }: ScoreInputProps): JSX.Element {
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
	);
}

// ── Validation messages ───────────────────────────────────────────────────────

function ValidationMessages({
	items,
}: {
	items: { message: string; type: 'error' | 'warning' }[];
}): JSX.Element | null {
	if (!items.length) return null;
	return (
		<ul className="space-y-1 text-sm">
			{items.map((item, i) => (
				<li
					key={i}
					className={cn(
						'flex items-center gap-2 rounded-lg px-3 py-2',
						item.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800',
					)}>
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
	);
}
