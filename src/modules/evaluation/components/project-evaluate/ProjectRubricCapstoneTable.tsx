'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/shared/components/ui';
import { Spinner } from '@/shared/components';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { performanceLevelsService } from '@/modules/academic/services';
import { useSubmitEvaluation } from '../../hooks/useEvaluations';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '../../types';

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
	readOnly?: boolean;
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
	readOnly = false,
}: ProjectRubricCapstoneTableProps) {
	const { t, locale } = useI18n();
	const { mutate: submitEvaluation, isPending } = useSubmitEvaluation(projectId);

	const [duplicateMode, setDuplicateMode] = useState(false);

	const { data: rawLevels = [], isLoading: isLoadingLevels } = useQuery({
		queryKey: ['performance-levels', { academicPeriodId: academicPeriodId, isActive: true }],
		queryFn: () =>
			performanceLevelsService
				.getByFilters({ academicPeriodId: academicPeriodId!, isActive: true })
				.then((r) => r.data),
		enabled: academicPeriodId != null,
	});

	const performanceLevels = useMemo<PerformanceLevel[]>(
		() =>
			rawLevels
				.filter((l) => l.uniqueValue != null)
				.map((l) => ({ id: l.id, name: l.name, uniqueValue: Number(l.uniqueValue) }))
				.sort((a, b) => a.uniqueValue - b.uniqueValue),
		[rawLevels],
	);

	const questionByOutcome = useMemo(() => {
		const map = new Map<number, RubricQuestionDetailsResponse>();
		for (const q of questions) {
			if (q.outcomeId != null) map.set(q.outcomeId, q);
		}
		return map;
	}, [questions]);

	const allCriteriaIds = useMemo(() => {
		const ids: number[] = [];
		for (const outcome of outcomes) {
			const q = questionByOutcome.get(outcome.id);
			for (const c of q?.criterias ?? []) ids.push(c.id);
		}
		return ids;
	}, [outcomes, questionByOutcome]);

	const initialSelections = useMemo<Selections>(() => {
		const result: Selections = {};
		for (const outcome of outcomes) {
			const q = questionByOutcome.get(outcome.id);
			for (const c of q?.criterias ?? []) {
				result[c.id] = {};
				for (const st of students) {
					const entry = c.scores.find(
						(s) => s.studentId === st.id && s.evaluatorId === evaluatorId,
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
			{ rubricQuestionCriteriaId: number; score: number; commentaries: Record<string, string> }[]
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
					existing.push({ rubricQuestionCriteriaId: c.id, score, commentaries: {} });
					studentScores.set(st.id, existing);
				}
			}
		}

		for (const [projectStudentId, scores] of studentScores.entries()) {
			submitEvaluation({
				projectStudentId: projectStudentId,
				projectEvaluatorId: evaluatorId,
				rubricId: rubricId,
				observation: { es: '', en: '' },
				scores,
				qualificationStatusTypeId: qualifStatuses[projectStudentId],
			});
		}
	};

	return (
		<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
			<div className="w-full overflow-x-auto">
				<table className="w-full table-auto border-collapse text-sm">
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
										<Toggle
											checked={duplicateMode}
											onChange={setDuplicateMode}
											disabled={readOnly}
										/>
										<span title={t('projects.evaluate.rubric.duplicateGradesInfo')}>
											<InformationCircleIcon className="h-4 w-4 cursor-help text-zinc-400" />
										</span>
									</div>
								</div>
							</th>
						</tr>
					</thead>

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

										<td className="px-4 py-4">
											<div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-snug text-zinc-600">
												{criteriaDesc}
											</div>
										</td>

										<td className="px-4 py-4">
											{isLoadingLevels ? (
												<Spinner
													size="sm"
													aria-label={t('projects.evaluate.capstone.loadingLevels')}
												/>
											) : !performanceLevels.length ? (
												<p className="text-xs text-zinc-400">
													{t('projects.evaluate.capstone.noLevels')}
												</p>
											) : duplicateMode ? (
												<PLSelector
													levels={performanceLevels}
													selected={dupSelections[criteria.id] ?? null}
													locale={locale}
													onChange={(val) => handleDupSelect(criteria.id, val)}
													disabled={readOnly}
												/>
											) : (
												<div className="flex flex-col gap-2">
													{students
														.filter((st) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1))
														.map((st) => {
															const current = selections[criteria.id]?.[st.id] ?? null;
															return (
																<div key={st.id} className="flex flex-wrap items-center gap-2">
																	<span className="w-28 shrink-0 truncate text-xs font-medium text-zinc-700">
																		{st.firstName} {st.lastName}
																	</span>
																	<PLSelector
																		levels={performanceLevels}
																		selected={current}
																		locale={locale}
																		onChange={(val) => handleSelect(criteria.id, st.id, val)}
																		disabled={readOnly}
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
						disabled={!allFilled || isPending || readOnly}
						className={cn(
							'inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
							allFilled && !isPending && !readOnly
								? 'bg-red-600 text-white hover:bg-red-700'
								: 'cursor-not-allowed bg-zinc-100 text-zinc-400',
						)}
						onClick={handleSave}>
						{readOnly
							? t('projects.evaluate.rubric.readOnly')
							: t('projects.evaluate.rubric.saveButton')}
						{isPending && (
							<span
								aria-hidden="true"
								className="ml-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]"
							/>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

interface PLButtonProps {
	value: number;
	label: string;
	selected: boolean;
	onClick: () => void;
	disabled?: boolean;
}

function PLButton({ label, selected, onClick, disabled }: PLButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				'rounded-md border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap',
				selected
					? 'border-red-600 bg-red-600 text-white'
					: 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50',
				disabled && 'cursor-not-allowed opacity-50',
			)}>
			{label}
		</button>
	);
}

interface PLSelectorProps {
	levels: PerformanceLevel[];
	selected: number | null;
	locale: string;
	onChange: (value: number) => void;
	disabled?: boolean;
}

function PLSelector({ levels, selected, locale, onChange, disabled }: PLSelectorProps) {
	return (
		<>
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
							disabled={disabled}
						/>
					);
				})}
			</div>

			<select
				value={selected ?? ''}
				onChange={(e) => {
					if (e.target.value !== '') onChange(Number(e.target.value));
				}}
				disabled={disabled}
				className={cn(
					'w-full rounded-md border px-2 py-1.5 text-xs outline-none md:hidden',
					disabled
						? 'cursor-not-allowed opacity-50 bg-zinc-50 text-zinc-500'
						: 'border-zinc-200 bg-white text-zinc-700 focus:border-red-600',
				)}>
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
