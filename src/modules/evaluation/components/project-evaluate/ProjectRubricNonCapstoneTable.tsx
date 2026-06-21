'use client';

import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useNonCapstoneRubricTable } from '../../hooks/useNonCapstoneRubricTable';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '../../types';
import { NonCapstoneRubricRow } from './NonCapstoneRubricRow';
import { NonCapstoneValidationMessages } from './NonCapstoneValidationMessages';

interface ProjectRubricNonCapstoneTableProps {
	questions: RubricQuestionDetailsResponse[];
	students: ProjectDetailsStudentResponse[];
	evaluatorId: number;
	rubricId: number;
	projectId: string | number;
	qualifStatuses: Record<number, number | null>;
	nrNaTypeIds: Set<number>;
	readOnly?: boolean;
	disableDuplicate?: boolean;
	onDirtyChange?: (isDirty: boolean) => void;
}

export function ProjectRubricNonCapstoneTable({
	questions,
	students,
	evaluatorId,
	rubricId,
	projectId,
	qualifStatuses,
	nrNaTypeIds,
	readOnly = false,
	disableDuplicate = false,
	onDirtyChange,
}: ProjectRubricNonCapstoneTableProps) {
	const {
		locale,
		isPending,
		duplicateMode,
		setDuplicateMode,
		scores,
		dupScores,
		ranges,
		msgNaN,
		msgRange,
		hasMissingStatus,
		allFilled,
		hasErrors,
		canSave,
		handleScore,
		handleDupScore,
		handleSave,
		t,
	} = useNonCapstoneRubricTable({
		questions,
		students,
		evaluatorId,
		rubricId,
		projectId,
		qualifStatuses,
		nrNaTypeIds,
		onDirtyChange,
	});

	return (
		<div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
			<div className="w-full overflow-x-auto">
				<table className="w-full table-auto border-collapse text-sm">
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
									{!disableDuplicate && (
										<div className="flex items-center gap-2">
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

					<tbody className="divide-y divide-zinc-100">
						{questions.map((q) => {
							const range = ranges[q.id] ?? { min: 0, max: 0 };

							return (
								<NonCapstoneRubricRow
									key={q.id}
									question={q}
									range={range}
									locale={locale}
									duplicateMode={duplicateMode}
									dupScores={dupScores}
									scores={scores}
									students={students}
									nrNaTypeIds={nrNaTypeIds}
									qualifStatuses={qualifStatuses}
									msgNaN={msgNaN}
									msgRange={msgRange}
									readOnly={readOnly}
									onDupScore={handleDupScore}
									onScore={handleScore}
								/>
							);
						})}
					</tbody>
				</table>
			</div>

			{!readOnly && (
				<div className="space-y-3 border-t border-zinc-200 px-6 py-4">
					<NonCapstoneValidationMessages
						items={[
							...(hasMissingStatus
								? [
										{
											message: t('projects.evaluate.rubric.missingStatus'),
											type: 'warning' as const,
										},
									]
								: []),
							...(!allFilled && !hasMissingStatus
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
							disabled={!canSave || isPending || readOnly}
							onClick={handleSave}
							className={cn(
								'inline-flex items-center rounded-lg px-5 py-2 text-sm font-semibold transition-colors',
								canSave && !isPending && !readOnly
									? 'bg-red-600 text-white hover:bg-red-700'
									: 'cursor-not-allowed bg-zinc-100 text-zinc-400',
							)}>
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
