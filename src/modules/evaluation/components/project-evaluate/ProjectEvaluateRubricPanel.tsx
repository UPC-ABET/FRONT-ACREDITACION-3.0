'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Badge, Card, I18nTextField, Select, TableEmptyState } from '@/shared/components/ui';
import type { I18nValue } from '@/shared/components/ui/I18nTextField';
import { TYPE_CODES } from '@/shared/constants';
import { ProjectRubricSingleCompetencyTable } from './ProjectRubricSingleCompetencyTable';
import { ProjectRubricMultipleCompetencyTable } from './ProjectRubricMultipleCompetencyTable';
import type {
	ProjectDetailsStudentResponse,
	ProjectRubricItemResponse,
	RubricTableHandle,
} from '../../types';

interface StatusOption {
	value: number;
	label: string;
}

interface ProjectEvaluateRubricPanelProps {
	isVisible: boolean;
	item: ProjectRubricItemResponse;
	students: ProjectDetailsStudentResponse[];
	evaluatorId: number;
	projectId: string | number;
	academicPeriodId: number | null;
	nonAttendanceTypeIds: Set<number>;
	statusOptions: StatusOption[];
	isLoadingStatuses: boolean;
	isReadOnly: boolean;
	disableDuplicate: boolean;
	isMultipleScope: boolean;
	t: (key: string) => string;
	onDirtyChange: (isDirty: boolean) => void;
	/** Keyed by projectStudentId — owned and edited by the page so it survives tab switches. */
	observations: Record<number, I18nValue>;
	dirtyStudentIds: Set<number>;
	onObservationChange: (studentId: number, value: I18nValue) => void;
	/** Reports this rubric's validation messages (same text as before) so the page can render
	 * them once, aggregated across every career/gradeType, instead of nested per rubric. */
	onIncompleteChange?: (items: { message: string; type: 'warning' | 'error' }[]) => void;
}

export const ProjectEvaluateRubricPanel = forwardRef<
	RubricTableHandle,
	ProjectEvaluateRubricPanelProps
>(function ProjectEvaluateRubricPanel(
	{
		isVisible,
		item,
		students,
		evaluatorId,
		projectId,
		academicPeriodId,
		nonAttendanceTypeIds,
		statusOptions,
		isLoadingStatuses,
		isReadOnly,
		disableDuplicate,
		isMultipleScope,
		t,
		onDirtyChange,
		observations,
		dirtyStudentIds,
		onObservationChange,
		onIncompleteChange,
	},
	ref,
) {
	const tableRef = useRef<RubricTableHandle>(null);

	useImperativeHandle(
		ref,
		() => ({
			get isDirty() {
				return tableRef.current?.isDirty ?? false;
			},
			get canSave() {
				return tableRef.current?.canSave ?? false;
			},
			get isPending() {
				return tableRef.current?.isPending ?? false;
			},
			save: async () => {
				await tableRef.current?.save();
			},
		}),
		[],
	);

	// Attendance is shared across every evaluator of the project — whoever marks it first, all
	// evaluators see and edit the same value, rather than each keeping their own.
	const initialQualifStatuses = useMemo<Record<number, number | null>>(() => {
		const result: Record<number, number | null> = {};
		for (const st of students) {
			const itemStudent = item.students.find((s) => s.projectStudentId === st.id);
			const entry = (itemStudent?.evaluationStatuses ?? [])[0];
			result[st.id] = entry?.qualificationStatusTypeId ?? null;
		}
		return result;
	}, [students, item]);

	const [qualifStatuses, setQualifStatuses] =
		useState<Record<number, number | null>>(initialQualifStatuses);
	// Attendance is not part of the rubric's dirty state, so track local edits separately to
	// keep a refetch (triggered by saving another tab) from reverting them.
	const [hasLocalStatusEdits, setHasLocalStatusEdits] = useState(false);
	// Same rule as the score grids: the tracker advances only when the value is applied. Advancing
	// it while there are local edits would mark another evaluator's attendance change as "seen"
	// without ever showing it, so it would stay hidden until a full reload.
	const [trackedQualifStatuses, setTrackedQualifStatuses] = useState(initialQualifStatuses);
	if (initialQualifStatuses !== trackedQualifStatuses && !hasLocalStatusEdits) {
		setTrackedQualifStatuses(initialQualifStatuses);
		setQualifStatuses(initialQualifStatuses);
	}

	const handleDirtyChange = (isDirty: boolean) => {
		// A successful save clears the rubric's dirty flag; local attendance edits are persisted too.
		if (!isDirty) setHasLocalStatusEdits(false);
		onDirtyChange(isDirty);
	};

	const isCapstone = item.rubric?.rubricType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE;
	const isCapstoneMultiple = isCapstone && isMultipleScope;

	const observationsDirty = students.some((st) => dirtyStudentIds.has(st.id));

	// Students that already have an observation start expanded, so the evaluator sees it without
	// having to click through every row.
	const studentIdsWithObservation = useMemo(
		() =>
			new Set(
				students
					.filter((st) => {
						const value = observations[st.id];
						return !!(value?.es?.trim() || value?.en?.trim());
					})
					.map((st) => st.id),
			),
		[students, observations],
	);

	const [openObservationIds, setOpenObservationIds] = useState<Set<number>>(
		() => studentIdsWithObservation,
	);
	const [trackedObservedIds, setTrackedObservedIds] = useState(studentIdsWithObservation);
	// Only an id that was not observed before forces a panel open, so the sync — and the extra
	// render pass it costs — is skipped when the set merely changed identity. Leaving the tracked
	// set stale on removals is deliberate: clearing an observation should not re-open the row if
	// the evaluator types into it again.
	if (studentIdsWithObservation !== trackedObservedIds) {
		const newlyObserved = [...studentIdsWithObservation].filter(
			(id) => !trackedObservedIds.has(id),
		);
		if (newlyObserved.length > 0) {
			setTrackedObservedIds(studentIdsWithObservation);
			setOpenObservationIds((prev) => new Set([...prev, ...newlyObserved]));
		}
	}
	const toggleObservationOpen = (studentId: number) => {
		setOpenObservationIds((prev) => {
			const next = new Set(prev);
			if (next.has(studentId)) {
				next.delete(studentId);
			} else {
				next.add(studentId);
			}
			return next;
		});
	};

	// The rubric can only be graded once every student's attendance is known — otherwise there's
	// no way to tell who should get a criteria score vs. the automatic non-attendance score.
	const hasMissingStatus =
		students.length > 0 && students.some((st) => qualifStatuses[st.id] == null);

	// The rubric table only reports its own warnings while mounted, so when attendance is
	// incomplete (and the table is hidden below) this panel must report the same warning itself.
	useEffect(() => {
		if (isReadOnly || !item.rubric || !hasMissingStatus) return;
		onIncompleteChange?.([
			{ message: t('projects.evaluate.rubric.missingStatus'), type: 'warning' },
		]);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- onIncompleteChange is a page-level setter; including it would re-fire on every page render
	}, [isReadOnly, item.rubric, hasMissingStatus, t]);

	return (
		<div className={isVisible ? 'space-y-4' : 'hidden'}>
			{item.rubric && (
				<div className="flex items-center gap-1.5 text-sm text-zinc-600">
					<span className="font-medium text-zinc-400">{t('projects.evaluate.header.rubric')}</span>
					<Badge variant={isCapstone ? 'success' : 'outline'}>
						{isCapstone ? t('rubrics.badges.capstone') : t('rubrics.badges.noCapstone')}
					</Badge>
				</div>
			)}

			<Card title={t('projects.evaluate.students.title')}>
				<div className="-m-4 divide-y divide-zinc-100">
					{students.length === 0 ? (
						<TableEmptyState message={t('projects.evaluate.students.empty')} />
					) : (
						students.map((student) => {
							const itemStudent = item.students.find((s) => s.projectStudentId === student.id);
							return (
								<div
									key={student.id}
									className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
									<div className="flex flex-col gap-0.5">
										<span className="font-medium text-zinc-900">
											{student.firstName} {student.lastName}
										</span>
										<div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
											<span className="font-mono">{student.studentCode}</span>
											<span className="text-zinc-300">·</span>
											<span>{student.email}</span>
										</div>
									</div>

									<div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-8">
										{!isReadOnly && (
											<div className="flex w-44 flex-col gap-0.5">
												<span className="text-xs font-medium text-zinc-400">
													{t('projects.evaluate.students.attendance')}
												</span>
												<Select
													size="sm"
													options={statusOptions}
													value={
														statusOptions.find((o) => o.value === qualifStatuses[student.id]) ??
														null
													}
													isDisabled={isLoadingStatuses}
													isClearable
													isSearchable
													placeholder="—"
													onChange={(_, val) => {
														const opt = Array.isArray(val) ? (val[0] ?? null) : val;
														setHasLocalStatusEdits(true);
														handleDirtyChange(true);
														setQualifStatuses((prev) => ({
															...prev,
															[student.id]: opt ? Number(opt.value) : null,
														}));
													}}
												/>
											</div>
										)}

										<div className="flex flex-col items-end gap-0.5">
											<span className="text-xs font-medium text-zinc-400">
												{t('projects.evaluate.students.grade')}
											</span>
											{itemStudent?.totalGrade != null ? (
												<span className="text-2xl font-bold tabular-nums text-zinc-900">
													{itemStudent.totalGrade}
													<span className="ml-0.5 text-sm font-normal text-zinc-400">/20</span>
												</span>
											) : (
												<span className="text-sm text-zinc-400">
													{t('projects.evaluate.students.noGrade')}
												</span>
											)}
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>
			</Card>

			{!item.rubric ? (
				<TableEmptyState message={t('projects.evaluate.rubric.noRubric')} />
			) : hasMissingStatus ? null : isCapstoneMultiple ? (
				<ProjectRubricMultipleCompetencyTable
					ref={tableRef}
					outcomes={item.outcomes}
					questions={item.questions}
					students={students}
					academicPeriodId={academicPeriodId}
					evaluatorId={evaluatorId}
					rubricId={item.rubric.id}
					projectId={projectId}
					qualifStatuses={qualifStatuses}
					nonAttendanceTypeIds={nonAttendanceTypeIds}
					readOnly={isReadOnly}
					disableDuplicate={disableDuplicate}
					onDirtyChange={handleDirtyChange}
					commissions={item.commissions}
					observations={observations}
					attendanceDirty={hasLocalStatusEdits || observationsDirty}
					onIncompleteChange={onIncompleteChange}
				/>
			) : item.questions.length > 0 ? (
				<ProjectRubricSingleCompetencyTable
					ref={tableRef}
					questions={item.questions}
					students={students}
					evaluatorId={evaluatorId}
					rubricId={item.rubric.id}
					projectId={projectId}
					qualifStatuses={qualifStatuses}
					nonAttendanceTypeIds={nonAttendanceTypeIds}
					readOnly={isReadOnly}
					disableDuplicate={disableDuplicate}
					onDirtyChange={handleDirtyChange}
					observations={observations}
					attendanceDirty={hasLocalStatusEdits || observationsDirty}
					onIncompleteChange={onIncompleteChange}
				/>
			) : null}

			{/* Only rendered when a rubric table is mounted below: without one there's nothing to
			    submit through, so an observation typed here would be silently discarded. */}
			{!isReadOnly &&
				!hasMissingStatus &&
				item.rubric &&
				students.length > 0 &&
				(isCapstoneMultiple || item.questions.length > 0) && (
					<Card title={t('projects.evaluate.rubric.observation')}>
						<div className="-m-4 divide-y divide-zinc-100">
							{students.map((student) => {
								const isOpen = openObservationIds.has(student.id);
								return (
									<div key={student.id}>
										<button
											type="button"
											onClick={() => toggleObservationOpen(student.id)}
											aria-expanded={isOpen}
											className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-zinc-50">
											<span className="text-sm font-medium text-zinc-800">
												{student.firstName} {student.lastName}
											</span>
											{isOpen ? (
												<MinusIcon className="h-4 w-4 shrink-0 text-zinc-400" />
											) : (
												<PlusIcon className="h-4 w-4 shrink-0 text-zinc-400" />
											)}
										</button>
										{isOpen && (
											<div className="px-4 pb-4">
												<I18nTextField
													layout="row"
													placeholder={t('projects.evaluate.rubric.observationPlaceholder')}
													value={observations[student.id] ?? { es: '', en: '' }}
													onChange={(value) => onObservationChange(student.id, value)}
													rows={3}
												/>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</Card>
				)}
		</div>
	);
});
