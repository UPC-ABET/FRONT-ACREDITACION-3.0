'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Skeleton, TableEmptyState, Title } from '@/shared/components/ui';
import { useAuth, useI18n } from '@/providers';
import { useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectDetails, useQualificationStatusTypes } from '../hooks';
import { ProjectRubricNonCapstoneTable } from '../components/project-evaluate/ProjectRubricNonCapstoneTable';
import { ProjectRubricCapstoneTable } from '../components/project-evaluate/ProjectRubricCapstoneTable';
import { TYPE_CODES } from '@/shared/constants';
import { cn } from '@/shared/lib/utils';

interface ProjectEvaluatePageProps {
	projectId: string;
	gradeTypeCode: string;
}

export function ProjectEvaluatePage({ projectId, gradeTypeCode }: ProjectEvaluatePageProps) {
	const { t, locale } = useI18n();
	const { user: authUser } = useAuth();

	const { data: professor } = useProfessorByUserId(authUser?.id);
	const professorId = professor?.id;

	const { data, isLoading, isError, error } = useProjectDetails(projectId, {
		gradeTypeCode,
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

	const initialQualifStatuses = useMemo<Record<number, number | null>>(() => {
		const result: Record<number, number | null> = {};
		for (const st of data?.students ?? []) {
			const entry = (st.evaluations ?? []).find((e) => e.evaluatorId === evaluatorId);
			result[st.id] = entry?.qualificationStatusTypeId ?? null;
		}
		return result;
	}, [data?.students, evaluatorId]);

	const [qualifStatuses, setQualifStatuses] =
		useState<Record<number, number | null>>(initialQualifStatuses);
	useEffect(() => {
		setQualifStatuses(initialQualifStatuses);
	}, [initialQualifStatuses]);

	const [activeStudyPlanCourseId, setActiveStudyPlanCourseId] = useState<number | null>(null);
	const [dirtyTabs, setDirtyTabs] = useState<Set<number>>(new Set());

	const handleDirtyChange = (studyPlanCourseId: number, isDirty: boolean) => {
		setDirtyTabs((prev) => {
			const next = new Set(prev);
			isDirty ? next.add(studyPlanCourseId) : next.delete(studyPlanCourseId);
			return next;
		});
	};

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

	const activeStudents = useMemo(() => {
		const effectiveSpcId = activeStudyPlanCourseId ?? careerIds[0] ?? null;
		return (data?.students ?? []).filter((s) => s.studyPlanCourseId === effectiveSpcId);
	}, [data?.students, activeStudyPlanCourseId, careerIds]);

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
				<div className="rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700 shadow-sm">
					{isError && error instanceof Error ? error.message : t('projects.evaluate.error')}
				</div>
			</div>
		);
	}

	const { project, students, rubrics, course } = data;

	const firstRubric = rubrics.find((r) => r.rubric != null) ?? rubrics[0] ?? null;

	const projectName = project.name[locale as 'es' | 'en'] ?? project.name.es;
	const courseName = course?.name[locale as 'es' | 'en'] ?? course?.name.es ?? '—';
	const rubricTypeName =
		firstRubric?.rubric?.rubricType?.name[locale as 'es' | 'en'] ??
		firstRubric?.rubric?.rubricType?.name.es ??
		'—';
	const gradeTypeName =
		firstRubric?.rubric?.gradeType?.name[locale as 'es' | 'en'] ??
		firstRubric?.rubric?.gradeType?.name.es ??
		'—';

	const isCapstone = firstRubric?.rubric?.rubricType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE;
	const isFinal = gradeTypeCode === TYPE_CODES.GRADE_TYPE.FINAL;
	const isCapstoneFinal = isCapstone && isFinal;

	const effectiveStudyPlanCourseId =
		activeStudyPlanCourseId ?? careerIds[0] ?? firstRubric?.studyPlanCourseId ?? null;
	const activeRubric =
		rubrics.find((r) => r.studyPlanCourseId === effectiveStudyPlanCourseId) ?? null;

	return (
		<div className="space-y-6">
			<Link
				href="/evaluation/grade-projects"
				className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800">
				<ArrowLeftIcon className="h-4 w-4" />
				{t('projects.evaluate.backButton')}
			</Link>

			<div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
				<div className="flex flex-col gap-4">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="space-y-1">
							<Title
								title={projectName}
								className="[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-zinc-900"
							/>
							<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium text-zinc-600">
								{project.code}
							</span>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-600">
						<div className="flex items-center gap-1.5">
							<span className="font-medium text-zinc-400">
								{t('projects.evaluate.header.course')}
							</span>
							<span>{courseName}</span>
						</div>
						<span className="text-zinc-200">|</span>
						<div className="flex items-center gap-1.5">
							<span className="font-medium text-zinc-400">
								{t('projects.evaluate.header.rubric')}
							</span>
							<span>{rubricTypeName}</span>
						</div>
						<span className="text-zinc-200">|</span>
						<div className="flex items-center gap-1.5">
							<span className="font-medium text-zinc-400">
								{t('projects.evaluate.header.gradeType')}
							</span>
							<span>{gradeTypeName}</span>
						</div>
					</div>
				</div>
			</div>

			<div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
				<div className="border-b border-zinc-100 px-6 py-4">
					<Title
						title={t('projects.evaluate.students.title')}
						className="[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-zinc-900"
					/>
				</div>

				<div className="divide-y divide-zinc-100">
					{students.length === 0 ? (
						<TableEmptyState message={t('projects.evaluate.students.empty')} />
					) : (
						students.map((student) => (
							<div key={student.id} className="flex items-center justify-between gap-4 px-6 py-4">
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

								{!isReadOnly && (
									<select
										value={qualifStatuses[student.id] ?? ''}
										onChange={(e) =>
											setQualifStatuses((prev) => ({
												...prev,
												[student.id]: Number(e.target.value),
											}))
										}
										disabled={isLoadingStatuses}
										className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-red-600 disabled:opacity-50">
										<option value="">—</option>
										{statusTypes.map((s) => (
											<option key={s.id} value={s.id}>
												{s.name[locale as 'es' | 'en'] ?? s.name.es}
											</option>
										))}
									</select>
								)}

								<div className="flex flex-col items-end gap-0.5">
									<span className="text-xs font-medium text-zinc-400">
										{t('projects.evaluate.students.grade')}
									</span>
									{student.totalGrade != null ? (
										<span className="text-2xl font-bold tabular-nums text-zinc-900">
											{student.totalGrade}
											<span className="ml-0.5 text-sm font-normal text-zinc-400">/20</span>
										</span>
									) : (
										<span className="text-sm text-zinc-400">
											{t('projects.evaluate.students.noGrade')}
										</span>
									)}
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{isReadOnly ? (
				<div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
					<EyeIcon className="h-5 w-5 shrink-0 text-blue-500" />
					<span>
						{isDocEvaluator
							? t('projects.evaluate.docReadOnly')
							: t('projects.evaluate.readOnlyNoPermission')}
					</span>
				</div>
			) : null}

			{!evaluatorId && !isReadOnly ? (
				<div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
					<ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-yellow-500" />
					<span>{t('projects.evaluate.notAssigned')}</span>
				</div>
			) : rubrics.length > 0 || careerIds.length > 0 ? (
				<div className="space-y-4">
					{careerIds.length > 1 && (
						<div className="border-b border-zinc-200">
							<nav className="-mb-px flex space-x-8">
								{careerIds.map((id) => {
									const rubricEntry = rubrics.find((r) => r.studyPlanCourseId === id);
									const label =
										rubricEntry?.programName?.[locale as 'es' | 'en'] ??
										rubricEntry?.programName?.es ??
										String(id);
									const isActive = id === effectiveStudyPlanCourseId;
									const dirty = dirtyTabs.has(id);
									return (
										<button
											key={id}
											onClick={() => setActiveStudyPlanCourseId(id)}
											className={cn(
												'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-1 py-4 text-xs font-bold uppercase tracking-wider transition-all',
												isActive
													? 'border-red-600 text-red-600'
													: 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700',
											)}>
											{dirty && (
												<ExclamationTriangleIcon
													className="h-4 w-4 shrink-0 text-amber-500"
													aria-label={t('projects.evaluate.tabs.unsavedChanges')}
												/>
											)}
											{label}
										</button>
									);
								})}
							</nav>
						</div>
					)}

					{!activeRubric?.rubric ? (
						<div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
							{t('projects.evaluate.rubric.noRubric')}
						</div>
					) : activeRubric?.rubric && isCapstoneFinal ? (
						<ProjectRubricCapstoneTable
							outcomes={activeRubric.outcomes}
							questions={activeRubric.questions}
							students={activeStudents}
							academicPeriodId={data.academicPeriod?.id ?? null}
							evaluatorId={evaluatorId}
							rubricId={activeRubric.rubric.id}
							projectId={projectId}
							qualifStatuses={qualifStatuses}
							nrNaTypeIds={nrNaTypeIds}
							readOnly={isReadOnly}
							disableDuplicate={careerIds.length > 1}
							onDirtyChange={(dirty) => handleDirtyChange(effectiveStudyPlanCourseId!, dirty)}
							commissions={activeRubric.commissions}
						/>
					) : activeRubric?.rubric && activeRubric.questions.length > 0 ? (
						<ProjectRubricNonCapstoneTable
							questions={activeRubric.questions}
							students={activeStudents}
							evaluatorId={evaluatorId}
							rubricId={activeRubric.rubric.id}
							projectId={projectId}
							qualifStatuses={qualifStatuses}
							nrNaTypeIds={nrNaTypeIds}
							readOnly={isReadOnly}
							disableDuplicate={careerIds.length > 1}
							onDirtyChange={(dirty) => handleDirtyChange(effectiveStudyPlanCourseId!, dirty)}
						/>
					) : null}
				</div>
			) : null}
		</div>
	);
}
