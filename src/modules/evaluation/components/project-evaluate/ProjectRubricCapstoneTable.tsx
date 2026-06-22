'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { InformationCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { Toggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { performanceLevelsService } from '@/modules/academic/services';
import { useCapstoneEvaluation } from '../../hooks/useCapstoneEvaluation';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '../../types';
import { CapstoneRubricRow } from './CapstoneRubricRow';
import type { PerformanceLevel } from './CapstonePerformanceLevelSelector';

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
	disableDuplicate?: boolean;
	onDirtyChange?: (isDirty: boolean) => void;
	commissions?: CommissionRow[];
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
	disableDuplicate = false,
	onDirtyChange,
	commissions = [],
}: ProjectRubricCapstoneTableProps) {
	const { t, locale } = useI18n();

	const [activeCommissionId, setActiveCommissionId] = useState<number | null>(
		() => commissions[0]?.id ?? null,
	);
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset the active commission tab to the first one when switching to a different rubric
		setActiveCommissionId(commissions[0]?.id ?? null);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally re-run only when rubricId changes; including commissions would reset the user's selected tab on every re-render
	}, [rubricId]);

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

	const {
		isPending,
		questionByOutcome,
		visibleOutcomes,
		selections,
		dupSelections,
		hasMissingStatus,
		commissionFillStatus,
		allFilled,
		handleSelect,
		handleDupSelect,
		handleSave,
	} = useCapstoneEvaluation({
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
	});

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
							<th className="min-w-[12rem] px-4 py-3 text-left md:min-w-[14rem]">
								<div className="flex items-center justify-between gap-4">
									<span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
										{t('projects.evaluate.capstone.score')}
									</span>
									{!disableDuplicate && (
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
									)}
								</div>
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
								<CapstoneRubricRow
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

			{!readOnly && (
				<div className="space-y-3 border-t border-zinc-200 px-6 py-4">
					{(hasMissingStatus || !allFilled) && (
						<ul className="space-y-1 text-sm">
							{hasMissingStatus && (
								<li className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
									<ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
									{t('projects.evaluate.rubric.missingStatus')}
								</li>
							)}
							{!allFilled && !hasMissingStatus && (
								<li className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
									<ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
									{t('projects.evaluate.capstone.fillAll')}
								</li>
							)}
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
			)}
		</div>
	);
}
