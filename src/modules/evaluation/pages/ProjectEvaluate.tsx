'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, EyeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Skeleton, TableEmptyState } from '@/shared/components/ui';
import { useAuth, useI18n } from '@/providers';
import { useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectDetails, useQualificationStatusTypes } from '../hooks';
import { ProjectRubricNonCapstoneTable } from '../components/project-evaluate/ProjectRubricNonCapstoneTable';
import { ProjectRubricCapstoneTable } from '../components/project-evaluate/ProjectRubricCapstoneTable';
import { TYPE_CODES } from '@/shared/constants';

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

	const evaluatorId = useMemo(() => {
		if (!data?.evaluators?.length || !professorId) return 0;
		const match = data.evaluators.find((e) => e.professorId === professorId);
		return match?.id ?? 0;
	}, [data?.evaluators, professorId]);

	const isDocEvaluator = useMemo(() => {
		if (!data?.evaluators?.length || !professorId) return false;
		const match = data.evaluators.find((e) => e.professorId === professorId);
		if (!match) return false;
		return match.evaluatorTypeCode === 'DOC';
	}, [data?.evaluators, professorId]);

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

	const { project, students, rubric, course } = data;

	const projectName = project.name[locale as 'es' | 'en'] ?? project.name.es;
	const courseName = course?.name[locale as 'es' | 'en'] ?? course?.name.es ?? '—';
	const rubricTypeName =
		rubric?.rubric?.rubricType?.name[locale as 'es' | 'en'] ??
		rubric?.rubric?.rubricType?.name.es ??
		'—';
	const gradeTypeName =
		rubric?.rubric?.gradeType?.name[locale as 'es' | 'en'] ??
		rubric?.rubric?.gradeType?.name.es ??
		'—';

	const isCapstone = rubric?.rubric?.rubricType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE;
	const isFinal = gradeTypeCode === TYPE_CODES.GRADE_TYPE.FINAL;
	const isCapstoneFinal = isCapstone && isFinal;

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
							<h1 className="text-3xl font-bold tracking-tight text-zinc-900">{projectName}</h1>
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
					<h2 className="text-base font-semibold text-zinc-900">
						{t('projects.evaluate.students.title')}
					</h2>
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

								<select
									value={qualifStatuses[student.id] ?? ''}
									onChange={(e) =>
										setQualifStatuses((prev) => ({
											...prev,
											[student.id]: Number(e.target.value),
										}))
									}
									disabled={isLoadingStatuses || isDocEvaluator}
									className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 outline-none focus:border-red-600 disabled:opacity-50">
									<option value="">—</option>
									{statusTypes.map((s) => (
										<option key={s.id} value={s.id}>
											{s.name[locale as 'es' | 'en'] ?? s.name.es}
										</option>
									))}
								</select>

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

			{isDocEvaluator ? (
				<div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
					<EyeIcon className="h-5 w-5 shrink-0 text-blue-500" />
					<span>{t('projects.evaluate.docReadOnly')}</span>
				</div>
			) : null}

			{!evaluatorId && !isDocEvaluator ? (
				<div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
					<ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-yellow-500" />
					<span>{t('projects.evaluate.notAssigned')}</span>
				</div>
			) : rubric && isCapstoneFinal ? (
				<ProjectRubricCapstoneTable
					outcomes={rubric.outcomes}
					questions={rubric.questions}
					students={students}
					academicPeriodId={data.academicPeriod?.id ?? null}
					evaluatorId={evaluatorId}
					rubricId={rubric.rubric.id}
					projectId={projectId}
					qualifStatuses={qualifStatuses}
					nrNaTypeIds={nrNaTypeIds}
					readOnly={isDocEvaluator}
				/>
			) : rubric && rubric.questions.length > 0 ? (
				<ProjectRubricNonCapstoneTable
					questions={rubric.questions}
					students={students}
					evaluatorId={evaluatorId}
					rubricId={rubric.rubric.id}
					projectId={projectId}
					qualifStatuses={qualifStatuses}
					nrNaTypeIds={nrNaTypeIds}
					readOnly={isDocEvaluator}
				/>
			) : null}
		</div>
	);
}
