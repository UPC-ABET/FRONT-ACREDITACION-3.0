'use client';

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { I18nValue } from '@/shared/components/ui/I18nTextField';
import { cn } from '@/shared/lib/utils';
import { localizedText } from '@/shared/utils';
import { useSingleCompetencyRubricTable } from '../../hooks/useSingleCompetencyRubricTable';
import type {
	RubricQuestionDetailsResponse,
	ProjectDetailsStudentResponse,
	RubricTableHandle,
} from '../../types';
import { DuplicateGradesToggle } from './DuplicateGradesToggle';
import { SingleCompetencyRubricRow } from './SingleCompetencyRubricRow';
import { SingleCompetencyScoreInput } from './SingleCompetencyScoreInput';
import { fmtNum, validateScore } from './singleCompetencyRubricUtils';

interface ProjectRubricSingleCompetencyTableProps {
	questions: RubricQuestionDetailsResponse[];
	students: ProjectDetailsStudentResponse[];
	evaluatorId: number;
	rubricId: number;
	projectId: string | number;
	qualifStatuses: Record<number, number | null>;
	nonAttendanceTypeIds: Set<number>;
	readOnly?: boolean;
	disableDuplicate?: boolean;
	onDirtyChange?: (isDirty: boolean) => void;
	observations: Record<number, I18nValue>;
	attendanceDirty?: boolean;
	/** Reports this rubric's validation messages (same text as before) so the page can render
	 * them once, aggregated across every career/gradeType, instead of nested per rubric. */
	onIncompleteChange?: (items: { message: string; type: 'warning' | 'error' }[]) => void;
}

export const ProjectRubricSingleCompetencyTable = forwardRef<
	RubricTableHandle,
	ProjectRubricSingleCompetencyTableProps
>(function ProjectRubricSingleCompetencyTable(
	{
		questions,
		students,
		evaluatorId,
		rubricId,
		projectId,
		qualifStatuses,
		nonAttendanceTypeIds,
		readOnly = false,
		disableDuplicate = false,
		onDirtyChange,
		observations,
		attendanceDirty,
		onIncompleteChange,
	},
	ref,
) {
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
		isDirty,
		handleScore,
		handleDupScore,
		handleSave,
		t,
	} = useSingleCompetencyRubricTable({
		questions,
		students,
		evaluatorId,
		rubricId,
		projectId,
		qualifStatuses,
		nonAttendanceTypeIds,
		onDirtyChange,
		observations,
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
			items.push({ message: t('projects.evaluate.rubric.fillAll'), type: 'warning' });
		}
		if (hasErrors) {
			items.push({ message: t('projects.evaluate.rubric.errorRange'), type: 'error' });
		}
		onIncompleteChange?.(items);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- onIncompleteChange is a page-level setter; including it would re-fire on every page render
	}, [hasMissingStatus, allFilled, hasErrors, readOnly, t]);

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
							<th className="w-48 min-w-[12rem] px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.rubric.question')}
							</th>
							<th className="min-w-[28rem] px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.rubric.criteria')}
							</th>
							<th className="min-w-[14rem] px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wider text-zinc-500">
								{t('projects.evaluate.rubric.score')}
							</th>
						</tr>
					</thead>

					<tbody className="divide-y divide-zinc-100">
						{questions.map((q) => {
							const range = ranges[q.id] ?? { min: 0, max: 0 };

							return (
								<SingleCompetencyRubricRow
									key={q.id}
									question={q}
									range={range}
									locale={locale}
									duplicateMode={duplicateMode}
									dupScores={dupScores}
									scores={scores}
									students={students}
									nonAttendanceTypeIds={nonAttendanceTypeIds}
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
				{questions.map((question, questionIndex) => {
					const range = ranges[question.id] ?? { min: 0, max: 0 };
					const questionText = localizedText(question.text, locale);
					const isOpen = openQuestionIds.has(question.id);

					return (
						<div key={question.id}>
							<button
								type="button"
								onClick={() => toggleQuestionOpen(question.id)}
								aria-expanded={isOpen}
								className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left">
								<div>
									<p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
										{t('projects.evaluate.rubric.question')} {questionIndex + 1}
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
										{question.criterias.map((criterion) => {
											const formattedMin = fmtNum(criterion.minValue);
											const formattedMax = fmtNum(criterion.maxValue);
											const criterionDescription = localizedText(criterion.text, locale);
											return (
												<div
													key={criterion.id}
													className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 text-xs text-zinc-600">
													<p className="mb-1 font-bold tabular-nums text-zinc-700">
														{formattedMin} – {formattedMax}
													</p>
													<p className="leading-snug">{criterionDescription}</p>
												</div>
											);
										})}
									</div>

									{duplicateMode ? (
										<SingleCompetencyScoreInput
											value={dupScores[question.id] ?? ''}
											min={range.min}
											max={range.max}
											error={validateScore(dupScores[question.id] ?? '', range, msgNaN, msgRange)}
											onChange={(value) => handleDupScore(question.id, value)}
											disabled={readOnly}
										/>
									) : (
										<div className="flex flex-col gap-2">
											{students
												.map((student, studentIndex) => ({ student, studentIndex }))
												.filter(
													({ student }) =>
														!nonAttendanceTypeIds.has(qualifStatuses[student.id] ?? -1),
												)
												.map(({ student, studentIndex }) => {
													const score = scores[question.id]?.[studentIndex] ?? '';
													return (
														<div
															key={student.id}
															className="flex items-center justify-between gap-2">
															<span className="min-w-0 truncate text-xs font-medium text-zinc-700">
																{student.firstName} {student.lastName}
															</span>
															<SingleCompetencyScoreInput
																value={score}
																min={range.min}
																max={range.max}
																error={validateScore(score, range, msgNaN, msgRange)}
																onChange={(value) => handleScore(question.id, studentIndex, value)}
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
		</div>
	);
});
