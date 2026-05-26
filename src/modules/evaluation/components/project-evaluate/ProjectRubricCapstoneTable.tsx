'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { performanceLevelsService } from '@/modules/academic/services';
import { useSubmitEvaluation } from '../../hooks/use-evaluations';
import type {
	RubricQuestionDetailsResponse,
	ProjectDetailsStudentResponse,
} from '../../api/dtos/response';

// ── Types ─────────────────────────────────────────────────────────────────────

type OutcomeRow = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

type PerformanceLevel = {
	id: number;
	name: { en: string; es: string };
	uniqueValue: number;
};

// criteriaId → studentId → selected uniqueValue
type Selections = Record<number, Record<number, number | null>>;
// criteriaId → selected uniqueValue (duplicate mode)
type DupSelections = Record<number, number | null>;

// ── Component ─────────────────────────────────────────────────────────────────

interface ProjectRubricCapstoneTableProps {
	outcomes: OutcomeRow[];
	questions: RubricQuestionDetailsResponse[];
	students: ProjectDetailsStudentResponse[];
	academicPeriodId: number | null;
	evaluatorId: number;
	rubricId: number;
	projectId: string | number;
	qualifStatuses: Record<number, number | null>;
	nrNaTypeIds: Set<number>;
}

export function ProjectRubricCapstoneTable({
	outcomes,
	questions,
	students,
	academicPeriodId,
	evaluatorId,
	rubricId,
	projectId,
	qualifStatuses,
	nrNaTypeIds,
}: ProjectRubricCapstoneTableProps) {
	const { t, locale } = useI18n();
	const { mutate: submitEvaluation, isPending } = useSubmitEvaluation(projectId);

	const [duplicateMode, setDuplicateMode] = useState(false);

	// ── Fetch performance levels ──────────────────────────────────────────────

	const { data: rawLevels = [], isLoading: isLoadingLevels } = useQuery({
		queryKey: ['performance-levels', { academic_period_id: academicPeriodId, is_active: true }],
		queryFn: () =>
			performanceLevelsService
				.getByFilters({ academic_period_id: academicPeriodId!, is_active: true })
				.then((r) => r.data),
		enabled: academicPeriodId != null,
	});

	const performanceLevels = useMemo<PerformanceLevel[]>(
		() =>
			rawLevels
				.filter((l) => l.unique_value != null)
				.map((l) => ({ id: l.id, name: l.name, uniqueValue: Number(l.unique_value) }))
				.sort((a, b) => a.uniqueValue - b.uniqueValue),
		[rawLevels],
	);

	// ── Map outcomeId → question ──────────────────────────────────────────────

	const questionByOutcome = useMemo(() => {
		const map = new Map<number, RubricQuestionDetailsResponse>();
		for (const q of questions) {
			if (q.outcomeId != null) map.set(q.outcomeId, q);
		}
		return map;
	}, [questions]);

	// ── All criteriaIds across all outcomes ───────────────────────────────────

	const allCriteriaIds = useMemo(() => {
		const ids: number[] = [];
		for (const outcome of outcomes) {
			const q = questionByOutcome.get(outcome.id);
			for (const c of q?.criterias ?? []) ids.push(c.id);
		}
		return ids;
	}, [outcomes, questionByOutcome]);

	// ── Pre-fill selections from existing scores ──────────────────────────────

	const initialSelections = useMemo<Selections>(() => {
		const result: Selections = {};
		for (const outcome of outcomes) {
			const q = questionByOutcome.get(outcome.id);
			for (const c of q?.criterias ?? []) {
				result[c.id] = {};
				for (const st of students) {
					const entry = c.scores.find(
						(s) => s.student_id === st.id && s.evaluator_id === evaluatorId,
					);
					result[c.id][st.id] = entry != null ? entry.score : null;
				}
			}
		}
		return result;
	}, [outcomes, students, questionByOutcome, evaluatorId]);

	const initialDupSelections = useMemo<DupSelections>(() => {
		const result: DupSelections = {};
		for (const id of allCriteriaIds) result[id] = null;
		return result;
	}, [allCriteriaIds]);

	const [selections, setSelections] = useState<Selections>(initialSelections);
	const [dupSelections, setDupSelections] = useState<DupSelections>(initialDupSelections);

	// Sync when data arrives after mount (React Query stale-while-revalidate)
	useEffect(() => {
		setSelections(initialSelections);
	}, [initialSelections]);
	useEffect(() => {
		setDupSelections(initialDupSelections);
	}, [initialDupSelections]);

	// ── Validation ────────────────────────────────────────────────────────────
	const allFilled = useMemo(() => {
		if (!allCriteriaIds.length || !students.length) return false;
		for (const st of students) {
			if (qualifStatuses[st.id] == null) return false;
		}
		const gradedStudents = students.filter((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1));
		for (const cId of allCriteriaIds) {
			if (duplicateMode) {
				if (gradedStudents.length > 0 && dupSelections[cId] == null) return false;
			} else {
				for (const st of gradedStudents) {
					if (selections[cId]?.[st.id] == null) return false;
				}
			}
		}
		return true;
	}, [
		allCriteriaIds,
		students,
		duplicateMode,
		selections,
		dupSelections,
		qualifStatuses,
		nrNaTypeIds,
	]);

	// ── Handlers ──────────────────────────────────────────────────────────────

	const handleSelect = (criteriaId: number, projectStudentId: number, value: number) =>
		setSelections((prev) => ({
			...prev,
			[criteriaId]: {
				...prev[criteriaId],
				[projectStudentId]: prev[criteriaId]?.[projectStudentId] === value ? null : value,
			},
		}));

	const handleDupSelect = (criteriaId: number, value: number) =>
		setDupSelections((prev) => ({
			...prev,
			[criteriaId]: prev[criteriaId] === value ? null : value,
		}));

	const handleSave = () => {
		const studentScores = new Map<
			number,
			{ rubric_question_criteria_id: number; score: number; commentaries: Record<string, string> }[]
		>();

		for (const st of students) {
			const isNrNa = nrNaTypeIds.has(qualifStatuses[st.id] ?? -1);
			for (const outcome of outcomes) {
				const q = questionByOutcome.get(outcome.id);
				for (const c of q?.criterias ?? []) {
					let score: number | null;
					if (isNrNa) {
						score = 0;
					} else if (duplicateMode) {
						score = dupSelections[c.id] ?? null;
					} else {
						score = selections[c.id]?.[st.id] ?? null;
					}
					if (score == null) continue;
					const existing = studentScores.get(st.id) ?? [];
					existing.push({ rubric_question_criteria_id: c.id, score, commentaries: {} });
					studentScores.set(st.id, existing);
				}
			}
		}

		for (const [projectStudentId, scores] of studentScores.entries()) {
			submitEvaluation({
				project_student_id: projectStudentId,
				project_evaluator_id: evaluatorId,
				rubric_id: rubricId,
				observation: { es: '', en: '' },
				scores,
				qualification_status_type_id: qualifStatuses[projectStudentId],
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
							<th className="w-40 min-w-[14rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.capstone.outcome')}
							</th>
							<th className="w-52 min-w-[16rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.capstone.criteria')}
							</th>
							<th className="min-w-[12rem] px-4 py-3 text-left md:min-w-[26rem]">
								<div className="flex items-center justify-between gap-4">
									<span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
										{t('projects.evaluate.capstone.score')}
									</span>
									<div className="flex items-center gap-2 shrink-0">
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
					<tbody>
						{outcomes.flatMap((outcome) => {
							const q = questionByOutcome.get(outcome.id);
							const criterias = q?.criterias ?? [];
							const outcomeName = outcome.name[locale as 'es' | 'en'] ?? outcome.name.es;
							const outcomeDesc =
								outcome.description[locale as 'es' | 'en'] ?? outcome.description.es;

							return criterias.map((criteria, idx) => {
								const criteriaDesc = criteria.text[locale as 'es' | 'en'] ?? criteria.text.es;
								const isFirstInOutcome = idx === 0;
								const isLastInOutcome = idx === criterias.length - 1;

								return (
									<tr
										key={criteria.id}
										className={cn('align-top', isLastInOutcome && 'border-b border-zinc-200')}>
										{/* Col 1 — Outcome (rowspan) */}
										{isFirstInOutcome && (
											<td
												rowSpan={criterias.length}
												className="border-b border-zinc-200 px-4 py-4 align-middle">
												<p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
													Outcome {outcome.code}
												</p>
												<p className="mt-1 text-sm font-semibold leading-snug text-zinc-800">
													{outcomeName}
												</p>
												<p className="mt-1 text-xs leading-snug text-zinc-500">{outcomeDesc}</p>
											</td>
										)}

										{/* Col 2 — Criteria description */}
										<td className="px-4 py-4">
											<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-snug text-zinc-600">
												{criteriaDesc}
											</div>
										</td>

										{/* Col 3 — Grading */}
										<td className="px-4 py-4">
											{isLoadingLevels ? (
												<p className="text-xs text-zinc-400">
													{t('projects.evaluate.capstone.loadingLevels')}
												</p>
											) : !performanceLevels.length ? (
												<p className="text-xs text-zinc-400">
													{t('projects.evaluate.capstone.noLevels')}
												</p>
											) : duplicateMode ? (
												/* Single row — duplicate mode */
												<PLSelector
													levels={performanceLevels}
													selected={dupSelections[criteria.id] ?? null}
													locale={locale}
													onChange={(val) => handleDupSelect(criteria.id, val)}
												/>
											) : (
												/* One row per student (NR/NA hidden) */
												<div className="flex flex-col gap-2">
													{students
														.filter((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1))
														.map((st) => {
															const current = selections[criteria.id]?.[st.id] ?? null;
															return (
																<div key={st.id} className="flex flex-wrap items-center gap-2">
																	<span className="w-28 shrink-0 truncate text-xs font-medium text-zinc-700">
																		{st.first_name} {st.last_name}
																	</span>
																	<PLSelector
																		levels={performanceLevels}
																		selected={current}
																		locale={locale}
																		onChange={(val) => handleSelect(criteria.id, st.id, val)}
																	/>
																</div>
															);
														})}
												</div>
											)}
										</td>
									</tr>
								);
							});
						})}
					</tbody>
				</table>
			</div>

			{/* Footer */}
			<div className="space-y-3 border-t border-zinc-200 px-6 py-4">
				{!allFilled && (
					<ul className="space-y-1 text-sm">
						<li className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
							<ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
							{t('projects.evaluate.capstone.fillAll')}
						</li>
					</ul>
				)}
				<div className="flex justify-end">
					<button
						type="button"
						disabled={!allFilled || isPending}
						className={cn(
							'inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
							allFilled && !isPending
								? 'bg-red-600 text-white hover:bg-red-700'
								: 'cursor-not-allowed bg-zinc-100 text-zinc-400',
						)}
						onClick={handleSave}>
						{isPending
							? t('projects.evaluate.rubric.saving')
							: t('projects.evaluate.rubric.saveButton')}
					</button>
				</div>
			</div>
		</div>
	);
}

// ── Performance level button ──────────────────────────────────────────────────

interface PLButtonProps {
	value: number;
	label: string;
	selected: boolean;
	onClick: () => void;
}

function PLButton({ label, selected, onClick }: PLButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'rounded-md border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap',
				selected
					? 'border-red-600 bg-red-600 text-white'
					: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50',
			)}>
			{label}
		</button>
	);
}

// ── Responsive PL selector: buttons on md+, <select> on small ────────────────

interface PLSelectorProps {
	levels: PerformanceLevel[];
	selected: number | null;
	locale: string;
	onChange: (value: number) => void;
}

function PLSelector({ levels, selected, locale, onChange }: PLSelectorProps) {
	return (
		<>
			{/* Buttons — md and above */}
			<div className="hidden flex-wrap gap-1.5 md:flex">
				{levels.map((pl) => {
					const label = `${pl.uniqueValue} - ${pl.name[locale as 'es' | 'en'] ?? pl.name.es}`;
					return (
						<PLButton
							key={pl.id}
							value={pl.uniqueValue}
							label={label}
							selected={selected === pl.uniqueValue}
							onClick={() => onChange(pl.uniqueValue)}
						/>
					);
				})}
			</div>

			{/* Select — small screens only */}
			<select
				value={selected ?? ''}
				onChange={(e) => {
					if (e.target.value !== '') onChange(Number(e.target.value));
				}}
				className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-red-600 md:hidden">
				<option value="">—</option>
				{levels.map((pl) => {
					const label = `${pl.uniqueValue} - ${pl.name[locale as 'es' | 'en'] ?? pl.name.es}`;
					return (
						<option key={pl.id} value={pl.uniqueValue}>
							{label}
						</option>
					);
				})}
			</select>
		</>
	);
}
