'use client';

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Badge, Card, Select, TableEmptyState } from '@/shared/components/ui';
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
	nrNaTypeIds: Set<number>;
	statusOptions: StatusOption[];
	isLoadingStatuses: boolean;
	isReadOnly: boolean;
	disableDuplicate: boolean;
	isMultipleScope: boolean;
	locale: string;
	t: (key: string) => string;
	onDirtyChange: (isDirty: boolean) => void;
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
		nrNaTypeIds,
		statusOptions,
		isLoadingStatuses,
		isReadOnly,
		disableDuplicate,
		isMultipleScope,
		locale,
		t,
		onDirtyChange,
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

	const initialQualifStatuses = useMemo<Record<number, number | null>>(() => {
		const result: Record<number, number | null> = {};
		for (const st of students) {
			const itemStudent = item.students.find((s) => s.projectStudentId === st.id);
			const entry = (itemStudent?.evaluationStatuses ?? []).find(
				(e) => e.evaluatorId === evaluatorId,
			);
			result[st.id] = entry?.qualificationStatusTypeId ?? null;
		}
		return result;
	}, [students, item, evaluatorId]);

	const [qualifStatuses, setQualifStatuses] =
		useState<Record<number, number | null>>(initialQualifStatuses);
	// Attendance is not part of the rubric's dirty state, so track local edits separately to
	// keep a refetch (triggered by saving another tab) from reverting them.
	const [hasLocalStatusEdits, setHasLocalStatusEdits] = useState(false);
	const [trackedQualifStatuses, setTrackedQualifStatuses] = useState(initialQualifStatuses);
	if (initialQualifStatuses !== trackedQualifStatuses) {
		setTrackedQualifStatuses(initialQualifStatuses);
		if (!hasLocalStatusEdits) setQualifStatuses(initialQualifStatuses);
	}

	const handleDirtyChange = (isDirty: boolean) => {
		// A successful save clears the rubric's dirty flag; local attendance edits are persisted too.
		if (!isDirty) setHasLocalStatusEdits(false);
		onDirtyChange(isDirty);
	};

	const initialObservation = useMemo(() => {
		for (const s of item.students) {
			if (s.observation != null) {
				return s.observation[locale as 'es' | 'en'] ?? s.observation.es ?? '';
			}
		}
		return '';
	}, [item, locale]);

	const isCapstone = item.rubric?.rubricType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE;
	const isCapstoneMultiple = isCapstone && isMultipleScope;

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
			) : isCapstoneMultiple ? (
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
					nrNaTypeIds={nrNaTypeIds}
					readOnly={isReadOnly}
					disableDuplicate={disableDuplicate}
					onDirtyChange={handleDirtyChange}
					commissions={item.commissions}
					initialObservation={initialObservation}
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
					nrNaTypeIds={nrNaTypeIds}
					readOnly={isReadOnly}
					disableDuplicate={disableDuplicate}
					onDirtyChange={handleDirtyChange}
					initialObservation={initialObservation}
				/>
			) : null}
		</div>
	);
});
