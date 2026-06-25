'use client';

import { useState } from 'react';
import { InformationCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Toggle } from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useNonCapstoneRubricTable } from '../../hooks/useNonCapstoneRubricTable';
import type { RubricQuestionDetailsResponse, ProjectDetailsStudentResponse } from '../../types';
import { NonCapstoneRubricRow } from './NonCapstoneRubricRow';
import { NonCapstoneScoreInput } from './NonCapstoneScoreInput';
import { NonCapstoneValidationMessages } from './NonCapstoneValidationMessages';
import { fmtNum, validateScore } from './nonCapstoneRubricUtils';

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

	const [openQuestionIds, setOpenQuestionIds] = useState<Set<number>>(new Set());

	const toggleQuestionOpen = (id: number) => {
		setOpenQuestionIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	return (
		<div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
			{!disableDuplicate && (
				<div className="flex items-center justify-end gap-2 border-b border-zinc-200 px-4 py-3">
					<span className="text-xs text-zinc-500">
						{t('projects.evaluate.rubric.duplicateGrades')}
					</span>
					<Toggle checked={duplicateMode} onChange={setDuplicateMode} disabled={readOnly} />
					<span title={t('projects.evaluate.rubric.duplicateGradesInfo')}>
						<InformationCircleIcon className="h-4 w-4 cursor-help text-zinc-400" />
					</span>
				</div>
			)}

			<div className="hidden w-full overflow-x-auto md:block">
				<table className="w-full table-auto border-collapse text-sm">
					<thead>
						<tr className="border-b border-zinc-200 bg-zinc-50">
							<th className="w-48 min-w-[12rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.rubric.question')}
							</th>
							<th className="min-w-[28rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.rubric.criteria')}
							</th>
							<th className="min-w-[14rem] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.rubric.score')}
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

			<div className="divide-y divide-zinc-100 md:hidden">
				{questions.map((q, qIdx) => {
					const range = ranges[q.id] ?? { min: 0, max: 0 };
					const questionText = q.text[locale as 'es' | 'en'] ?? q.text.es;
					const isOpen = openQuestionIds.has(q.id);

					return (
						<div key={q.id}>
							<button
								type="button"
								onClick={() => toggleQuestionOpen(q.id)}
								className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
								<div>
									<p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
										{t('projects.evaluate.rubric.question')} {qIdx + 1}
									</p>
									<p className="text-xs leading-snug text-zinc-700">{questionText}</p>
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

									{duplicateMode ? (
										<NonCapstoneScoreInput
											value={dupScores[q.id] ?? ''}
											min={range.min}
											max={range.max}
											error={validateScore(dupScores[q.id] ?? '', range, msgNaN, msgRange)}
											onChange={(val) => handleDupScore(q.id, val)}
											disabled={readOnly}
										/>
									) : (
										<div className="flex flex-col gap-2">
											{students
												.map((st, stIdx) => ({ st, stIdx }))
												.filter(({ st }) => !nrNaTypeIds.has(qualifStatuses[st.id] ?? -1))
												.map(({ st, stIdx }) => {
													const val = scores[q.id]?.[stIdx] ?? '';
													return (
														<div key={stIdx} className="flex items-center justify-between gap-2">
															<span className="min-w-0 truncate text-xs font-medium text-zinc-700">
																{st.firstName} {st.lastName}
															</span>
															<NonCapstoneScoreInput
																value={val}
																min={range.min}
																max={range.max}
																error={validateScore(val, range, msgNaN, msgRange)}
																onChange={(v) => handleScore(q.id, stIdx, v)}
																disabled={readOnly}
															/>
														</div>
													);
												})}
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
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
