'use client';

import { forwardRef, useEffect, useImperativeHandle, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExclamationTriangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Spinner } from '@/shared/components/ui';
import type { I18nValue } from '@/shared/components/ui/I18nTextField';
import { cn } from '@/shared/lib/utils';
import { localizedText } from '@/shared/utils';
import { useI18n } from '@/providers';
import { performanceLevelsService } from '@/modules/academic/services';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { TYPE_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import { useMultipleCompetencyEvaluation } from '../../hooks/useMultipleCompetencyEvaluation';
import type {
	RubricQuestionDetailsResponse,
	ProjectDetailsStudentResponse,
	RubricTableHandle,
} from '../../types';
import { MultipleCompetencyRubricRow } from './MultipleCompetencyRubricRow';
import { DuplicateGradesToggle } from './DuplicateGradesToggle';
import { PLSelector, type PerformanceLevel } from './MultipleCompetencyPerformanceLevelSelector';

type OutcomeRow = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

type CommissionRow = {
	id: number;
	code: string;
	name: { es: string; en: string };
	outcomeIds: number[];
};

interface ProjectRubricMultipleCompetencyTableProps {
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
	disableDuplicate?: boolean;
	onDirtyChange?: (isDirty: boolean) => void;
	commissions?: CommissionRow[];
	observation: I18nValue;
	attendanceDirty?: boolean;
	/** Reports this rubric's validation messages (same text as before) so the page can render
	 * them once, aggregated across every career/gradeType, instead of nested per rubric. */
	onIncompleteChange?: (items: { message: string; type: 'warning' | 'error' }[]) => void;
}

export const ProjectRubricMultipleCompetencyTable = forwardRef<
	RubricTableHandle,
	ProjectRubricMultipleCompetencyTableProps
>(function ProjectRubricMultipleCompetencyTable(
	{
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
		disableDuplicate = false,
		onDirtyChange,
		commissions = [],
		observation,
		attendanceDirty,
		onIncompleteChange,
	},
	ref,
) {
	const { t, locale } = useI18n();

	const [activeCommissionId, setActiveCommissionId] = useState<number | null>(
		() => commissions[0]?.id ?? null,
	);
	const [trackedRubricId, setTrackedRubricId] = useState(rubricId);
	if (rubricId !== trackedRubricId) {
		setTrackedRubricId(rubricId);
		setActiveCommissionId(commissions[0]?.id ?? null);
	}

	const [duplicateMode, setDuplicateMode] = useState(false);
	const [openOutcomeIds, setOpenOutcomeIds] = useState<Set<number>>(new Set());

	const toggleOutcomeOpen = (id: number) => {
		setOpenOutcomeIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const { data: instrumentTypes = [] } = useTypesByGroupCode(
		TYPE_GROUP_CODES.PERFORMANCE_LEVEL_INSTRUMENT,
	);
	const rubricInstrumentTypeId = instrumentTypes.find(
		(type) => type.code === TYPE_CODES.PERFORMANCE_LEVEL_INSTRUMENT.RUBRIC,
	)?.id;

	const { data: rawLevels = [], isLoading: isLoadingLevels } = useQuery({
		queryKey: [
			'performance-levels',
			{ academicPeriodId, isActive: true, instrumentTypeId: rubricInstrumentTypeId },
		],
		queryFn: () =>
			performanceLevelsService
				.getByFilters({
					academicPeriodId: academicPeriodId!,
					isActive: true,
					instrumentTypeId: rubricInstrumentTypeId,
				})
				.then((r) => r.data),
		enabled: academicPeriodId != null && rubricInstrumentTypeId != null,
	});

	const performanceLevels = useMemo<PerformanceLevel[]>(
		() =>
			rawLevels
				.filter((l) => l.uniqueValue != null)
				.map((l) => ({ id: l.id, name: l.name, uniqueValue: Number(l.uniqueValue) }))
				.sort((a, b) => a.uniqueValue - b.uniqueValue),
		[rawLevels],
	);

	const {
		isPending,
		questionByOutcome,
		visibleOutcomes,
		selections,
		dupSelections,
		hasMissingStatus,
		commissionFillStatus,
		allFilled,
		canSave,
		isDirty,
		handleSelect,
		handleDupSelect,
		handleSave,
	} = useMultipleCompetencyEvaluation({
		outcomes,
		questions,
		students,
		evaluatorId,
		rubricId,
		projectId,
		qualifStatuses,
		nrNaTypeIds,
		duplicateMode,
		commissions,
		activeCommissionId,
		onDirtyChange,
		observation,
		attendanceDirty,
	});

	useImperativeHandle(ref, () => ({ isDirty, canSave, isPending, save: handleSave }), [
		isDirty,
		canSave,
		isPending,
		handleSave,
	]);

	useEffect(() => {
		if (readOnly) return;
		const items: { message: string; type: 'warning' | 'error' }[] = [];
		if (hasMissingStatus) {
			items.push({ message: t('projects.evaluate.rubric.missingStatus'), type: 'warning' });
		}
		if (!allFilled && !hasMissingStatus) {
			items.push({
				message: t('projects.evaluate.multipleCompetency.fillAll'),
				type: 'warning',
			});
		}
		onIncompleteChange?.(items);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- onIncompleteChange is a page-level setter; including it would re-fire on every page render
	}, [hasMissingStatus, allFilled, readOnly, t]);

	return (
		<div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
			{commissions.length > 0 && (
				<div className="border-b border-zinc-200 rounded-xl ">
					<nav className="-mb-px flex flex-wrap gap-1" aria-label="Commissions">
						{commissions.map((commission) => {
							const status = commissionFillStatus[commission.id] ?? 'empty';
							const isActive = commission.id === activeCommissionId;
							return (
								<button
									key={commission.id}
									type="button"
									onClick={() => setActiveCommissionId(commission.id)}
									className={cn(
										'flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors',
										isActive
											? 'border-zinc-300 bg-zinc-100 text-zinc-900'
											: 'border-transparent text-zinc-600 hover:border-zinc-200 hover:bg-zinc-50 hover:text-zinc-800',
									)}>
									{status === 'complete' ? (
										<CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
									) : status === 'partial' ? (
										<ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
									) : (
										<span
											className="inline-block h-4 w-4 shrink-0 rounded-full bg-zinc-200"
											aria-hidden
										/>
									)}
									<span className="font-semibold">{commission.code}</span>
								</button>
							);
						})}
					</nav>
				</div>
			)}
			{!disableDuplicate && (
				<DuplicateGradesToggle
					checked={duplicateMode}
					onChange={setDuplicateMode}
					disabled={readOnly}
				/>
			)}

			<div className="hidden w-full overflow-x-auto md:block">
				<table className="w-full table-auto border-collapse text-[13px]">
					<thead>
						<tr className="border-b border-zinc-200 bg-zinc-50">
							<th className="w-40 min-w-[14rem] px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.multipleCompetency.outcome')}
							</th>
							<th className="w-52 min-w-[16rem] px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.multipleCompetency.criteria')}
							</th>
							<th className="min-w-[12rem] px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-zinc-500 md:min-w-[14rem]">
								{t('projects.evaluate.multipleCompetency.score')}
							</th>
						</tr>
					</thead>

					<tbody>
						{visibleOutcomes.flatMap((outcome) => {
							const q = questionByOutcome.get(outcome.id);
							const criterias = q?.criterias ?? [];
							const outcomeDesc =
								outcome.description[locale as 'es' | 'en'] ?? outcome.description.es;

							return criterias.map((criteria, idx) => (
								<MultipleCompetencyRubricRow
									key={criteria.id}
									criteria={criteria}
									criterias={criterias}
									idx={idx}
									outcomeCode={outcome.code}
									outcomeDesc={outcomeDesc}
									locale={locale}
									isLoadingLevels={isLoadingLevels}
									performanceLevels={performanceLevels}
									duplicateMode={duplicateMode}
									dupSelections={dupSelections}
									selections={selections}
									students={students}
									nrNaTypeIds={nrNaTypeIds}
									qualifStatuses={qualifStatuses}
									readOnly={readOnly}
									onSelect={handleSelect}
									onDupSelect={handleDupSelect}
								/>
							));
						})}
					</tbody>
				</table>
			</div>

			<div className="divide-y divide-zinc-200 md:hidden">
				{visibleOutcomes.map((outcome) => {
					const question = questionByOutcome.get(outcome.id);
					const criterias = question?.criterias ?? [];
					const outcomeDescription = localizedText(outcome.description, locale);
					const isOpen = openOutcomeIds.has(outcome.id);

					return (
						<div key={outcome.id}>
							<button
								type="button"
								onClick={() => toggleOutcomeOpen(outcome.id)}
								aria-expanded={isOpen}
								className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
								<div>
									<p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
										{t('projects.evaluate.multipleCompetency.outcome')}
									</p>
									<p className="text-sm font-semibold text-zinc-800">{outcome.code}</p>
								</div>
								<ChevronDownIcon
									className={cn(
										'h-4 w-4 shrink-0 text-zinc-400 transition-transform',
										isOpen && 'rotate-180',
									)}
								/>
							</button>

							{isOpen && (
								<div className="space-y-3 px-4 pb-4">
									<p className="text-xs leading-snug text-zinc-500">{outcomeDescription}</p>

									{criterias.map((criterion) => {
										const criterionDescription = localizedText(criterion.text, locale);
										return (
											<div key={criterion.id} className="rounded-lg border border-zinc-200 p-3">
												<div className="mb-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs leading-snug text-zinc-600">
													{criterionDescription}
												</div>

												{isLoadingLevels ? (
													<Spinner
														size="sm"
														aria-label={t('projects.evaluate.multipleCompetency.loadingLevels')}
													/>
												) : !performanceLevels.length ? (
													<p className="text-xs text-zinc-400">
														{t('projects.evaluate.multipleCompetency.noLevels')}
													</p>
												) : duplicateMode ? (
													<PLSelector
														levels={performanceLevels}
														selected={dupSelections[criterion.id] ?? null}
														locale={locale}
														onChange={(value) => handleDupSelect(criterion.id, value)}
														disabled={readOnly}
													/>
												) : (
													<div className="flex flex-col gap-3">
														{students
															.filter(
																(student) => !nrNaTypeIds.has(qualifStatuses[student.id] ?? -1),
															)
															.map((student) => {
																const current = selections[criterion.id]?.[student.id] ?? null;
																return (
																	<div key={student.id} className="flex flex-col gap-1">
																		<span className="text-xs font-medium text-zinc-700">
																			{student.firstName} {student.lastName}
																		</span>
																		<PLSelector
																			levels={performanceLevels}
																			selected={current}
																			locale={locale}
																			onChange={(value) =>
																				handleSelect(criterion.id, student.id, value)
																			}
																			disabled={readOnly}
																		/>
																	</div>
																);
															})}
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
});
