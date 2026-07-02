'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
	Alert,
	AlertDescription,
	Badge,
	Card,
	PageHeader,
	Select,
	Skeleton,
	TableEmptyState,
	TableErrorState,
	Tabs,
} from '@/shared/components/ui';
import { useTabParam } from '@/shared';
import { useAuth, useI18n } from '@/providers';
import { useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectDetails, useQualificationStatusTypes } from '../hooks';
import { ProjectRubricSingleCompetencyTable } from '../components/project-evaluate/ProjectRubricSingleCompetencyTable';
import { ProjectRubricMultipleCompetencyTable } from '../components/project-evaluate/ProjectRubricMultipleCompetencyTable';
import { TYPE_CODES } from '@/shared/constants';

interface ProjectEvaluatePageProps {
	projectId: string;
	competencyScopeCode: string;
}

function dirtyKey(studyPlanCourseId: number, gradeTypeId: number): string {
	return `${studyPlanCourseId}:${gradeTypeId}`;
}

export function ProjectEvaluatePage({ projectId, competencyScopeCode }: ProjectEvaluatePageProps) {
	const { t, locale } = useI18n();
	const { user: authUser } = useAuth();

	const { data: professor } = useProfessorByUserId(authUser?.id);
	const professorId = professor?.id;

	const { data, isLoading, isError, error } = useProjectDetails(projectId, {
		competencyScopeCode,
		isEvaluationMode: true,
	});
	const { statusTypes, isLoading: isLoadingStatuses } = useQualificationStatusTypes();

	const nrNaTypeIds = useMemo(() => {
		const nrNaCodes = new Set<string>([
			TYPE_CODES.QUALIFICATION_STATUS.NR,
			TYPE_CODES.QUALIFICATION_STATUS.NA,
		]);
		return new Set(statusTypes.filter((s) => nrNaCodes.has(s.code)).map((s) => s.id));
	}, [statusTypes]);

	const myEvaluatorEntries = useMemo(
		() => (data?.evaluators ?? []).filter((e) => e.professorId === professorId),
		[data?.evaluators, professorId],
	);

	// Use the first canEvaluate entry as the grading identity; fall back to first entry
	const evaluatorId = useMemo(() => {
		if (!myEvaluatorEntries.length) return 0;
		const grading = myEvaluatorEntries.find((e) => e.canEvaluate);
		return (grading ?? myEvaluatorEntries[0]).id;
	}, [myEvaluatorEntries]);

	// Read-only when none of the professor's entries have canEvaluate
	const isReadOnly = useMemo(() => {
		if (!myEvaluatorEntries.length) return false;
		return !myEvaluatorEntries.some((e) => e.canEvaluate);
	}, [myEvaluatorEntries]);

	// Keep isDocEvaluator for the "view-only" banner
	const isDocEvaluator = useMemo(
		() =>
			myEvaluatorEntries.some(
				(e) => e.evaluatorTypeCode === TYPE_CODES.EVALUATOR_TYPE_CODE.TEACHER,
			),
		[myEvaluatorEntries],
	);

	const [activeTab, setTab] = useTabParam('');
	const activeStudyPlanCourseId = activeTab ? Number(activeTab) : null;

	const [activeGradeTab, setGradeTab] = useTabParam('', { paramName: 'gradeTab' });
	const activeGradeTypeId = activeGradeTab ? Number(activeGradeTab) : null;

	const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());

	const statusOptions = useMemo(
		() =>
			statusTypes.map((s) => ({ value: s.id, label: s.name[locale as 'es' | 'en'] ?? s.name.es })),
		[statusTypes, locale],
	);

	const handleDirtyChange = (studyPlanCourseId: number, gradeTypeId: number, isDirty: boolean) => {
		setDirtyTabs((prev) => {
			const next = new Set(prev);
			const key = dirtyKey(studyPlanCourseId, gradeTypeId);
			if (isDirty) {
				next.add(key);
			} else {
				next.delete(key);
			}
			return next;
		});
	};

	const rubrics = useMemo(() => data?.rubrics ?? [], [data?.rubrics]);

	const careerIds = useMemo(
		() => [
			...new Set(
				(data?.students ?? [])
					.map((s) => s.studyPlanCourseId)
					.filter((id): id is number => id != null),
			),
		],
		[data?.students],
	);

	const effectiveStudyPlanCourseId = activeStudyPlanCourseId ?? careerIds[0] ?? null;

	const activeRubricEntry = useMemo(
		() => rubrics.find((r) => r.studyPlanCourseId === effectiveStudyPlanCourseId) ?? null,
		[rubrics, effectiveStudyPlanCourseId],
	);

	const activeItems = useMemo(() => activeRubricEntry?.items ?? [], [activeRubricEntry]);

	const effectiveGradeTypeId = useMemo(() => {
		if (activeItems.some((item) => item.gradeType.id === activeGradeTypeId)) {
			return activeGradeTypeId;
		}
		return activeItems[0]?.gradeType.id ?? null;
	}, [activeItems, activeGradeTypeId]);

	const activeItem = useMemo(
		() => activeItems.find((item) => item.gradeType.id === effectiveGradeTypeId) ?? null,
		[activeItems, effectiveGradeTypeId],
	);

	const activeStudents = useMemo(() => {
		return (data?.students ?? []).filter((s) => s.studyPlanCourseId === effectiveStudyPlanCourseId);
	}, [data?.students, effectiveStudyPlanCourseId]);

	const initialQualifStatuses = useMemo<Record<number, number | null>>(() => {
		const result: Record<number, number | null> = {};
		for (const st of activeStudents) {
			const itemStudent = activeItem?.students.find((s) => s.projectStudentId === st.id);
			const entry = (itemStudent?.evaluationStatuses ?? []).find(
				(e) => e.evaluatorId === evaluatorId,
			);
			result[st.id] = entry?.qualificationStatusTypeId ?? null;
		}
		return result;
	}, [activeStudents, activeItem, evaluatorId]);

	const [qualifStatuses, setQualifStatuses] =
		useState<Record<number, number | null>>(initialQualifStatuses);
	const [trackedQualifStatuses, setTrackedQualifStatuses] = useState(initialQualifStatuses);
	if (initialQualifStatuses !== trackedQualifStatuses) {
		setTrackedQualifStatuses(initialQualifStatuses);
		setQualifStatuses(initialQualifStatuses);
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="space-y-4">
				<Link
					href="/evaluation/grade-projects"
					className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
					<ArrowLeftIcon className="h-4 w-4" />
					{t('projects.evaluate.backButton')}
				</Link>
				<TableErrorState
					message={isError && error instanceof Error ? error.message : t('projects.evaluate.error')}
				/>
			</div>
		);
	}

	const { project, course } = data;

	const projectName = project.name[locale as 'es' | 'en'] ?? project.name.es;
	const courseName = course?.name[locale as 'es' | 'en'] ?? course?.name.es ?? '—';

	const isCapstone = activeItem?.rubric?.rubricType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE;
	const isFinal = competencyScopeCode === TYPE_CODES.COMPETENCY_SCOPE.MULTIPLE;
	const isCapstoneFinal = isCapstone && isFinal;

	return (
		<div className="space-y-6">
			<Link
				href="/evaluation/grade-projects"
				className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
				<ArrowLeftIcon className="h-4 w-4" />
				{t('projects.evaluate.backButton')}
			</Link>

			<PageHeader title={projectName} />

			<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-600">
				<span className="inline-flex w-fit items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-600">
					{project.code}
				</span>
				<span className="text-zinc-200">|</span>
				<div className="flex items-center gap-1.5">
					<span className="font-medium text-zinc-400">{t('projects.evaluate.header.course')}</span>
					<span>{courseName}</span>
				</div>
			</div>

			{isReadOnly ? (
				<Alert variant="default" className="flex items-center gap-3">
					<EyeIcon className="h-5 w-5 shrink-0 text-zinc-500" />
					<AlertDescription>
						{isDocEvaluator
							? t('projects.evaluate.docReadOnly')
							: t('projects.evaluate.readOnlyNoPermission')}
					</AlertDescription>
				</Alert>
			) : null}

			{!evaluatorId && !isReadOnly ? (
				<Alert variant="warning" className="flex items-center gap-3">
					<ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-yellow-600" />
					<AlertDescription>{t('projects.evaluate.notAssigned')}</AlertDescription>
				</Alert>
			) : rubrics.length > 0 || careerIds.length > 0 ? (
				<div className="space-y-4">
					{careerIds.length > 0 && (
						<Tabs
							tabs={careerIds.map((id) => {
								const rubricEntry = rubrics.find((r) => r.studyPlanCourseId === id);
								const label =
									rubricEntry?.programName?.[locale as 'es' | 'en'] ??
									rubricEntry?.programName?.es ??
									String(id);
								const dirty = [...dirtyTabs].some((key) => key.startsWith(`${id}:`));
								return { id: String(id), label: dirty ? `${label} •` : label };
							})}
							activeTab={String(effectiveStudyPlanCourseId ?? '')}
							onChange={setTab}
						/>
					)}

					{activeItems.length > 0 && (
						<Tabs
							tabs={activeItems.map((item) => {
								const label = item.gradeType.name[locale as 'es' | 'en'] ?? item.gradeType.name.es;
								const dirty =
									effectiveStudyPlanCourseId != null &&
									dirtyTabs.has(dirtyKey(effectiveStudyPlanCourseId, item.gradeType.id));
								return { id: String(item.gradeType.id), label: dirty ? `${label} •` : label };
							})}
							activeTab={String(effectiveGradeTypeId ?? '')}
							onChange={setGradeTab}
						/>
					)}

					{activeItem?.rubric && (
						<div className="flex items-center gap-1.5 text-sm text-zinc-600">
							<span className="font-medium text-zinc-400">
								{t('projects.evaluate.header.rubric')}
							</span>
							<Badge variant={isCapstone ? 'success' : 'outline'}>
								{isCapstone ? 'Capstone' : 'No Capstone'}
							</Badge>
						</div>
					)}

					<Card title={t('projects.evaluate.students.title')}>
						<div className="-m-4 divide-y divide-zinc-100">
							{activeStudents.length === 0 ? (
								<TableEmptyState message={t('projects.evaluate.students.empty')} />
							) : (
								activeStudents.map((student) => {
									const itemStudent = activeItem?.students.find(
										(s) => s.projectStudentId === student.id,
									);
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
															placeholder="—"
															onChange={(_, val) => {
																const opt = Array.isArray(val) ? (val[0] ?? null) : val;
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

					{!activeItem?.rubric ? (
						<TableEmptyState message={t('projects.evaluate.rubric.noRubric')} />
					) : isCapstoneFinal ? (
						<ProjectRubricMultipleCompetencyTable
							outcomes={activeItem.outcomes}
							questions={activeItem.questions}
							students={activeStudents}
							academicPeriodId={data.academicPeriod?.id ?? null}
							evaluatorId={evaluatorId}
							rubricId={activeItem.rubric.id}
							projectId={projectId}
							qualifStatuses={qualifStatuses}
							nrNaTypeIds={nrNaTypeIds}
							readOnly={isReadOnly}
							disableDuplicate={careerIds.length > 1}
							onDirtyChange={(dirty) =>
								handleDirtyChange(effectiveStudyPlanCourseId!, effectiveGradeTypeId!, dirty)
							}
							commissions={activeItem.commissions}
						/>
					) : activeItem.questions.length > 0 ? (
						<ProjectRubricSingleCompetencyTable
							questions={activeItem.questions}
							students={activeStudents}
							evaluatorId={evaluatorId}
							rubricId={activeItem.rubric.id}
							projectId={projectId}
							qualifStatuses={qualifStatuses}
							nrNaTypeIds={nrNaTypeIds}
							readOnly={isReadOnly}
							disableDuplicate={careerIds.length > 1}
							onDirtyChange={(dirty) =>
								handleDirtyChange(effectiveStudyPlanCourseId!, effectiveGradeTypeId!, dirty)
							}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
}
