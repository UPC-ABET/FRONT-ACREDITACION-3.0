'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import {
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
} from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { useAuth } from '@/providers';
import { getSchoolCookie } from '@/shared/lib/authCookies';
import { useAcademicPeriods, useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectsByProfessor } from '../hooks';
import { TYPE_CODES } from '@/modules/core';

type RubricTab = 'partial' | 'final';

const GRADE_TYPE_CODE: Record<RubricTab, string> = {
	partial: TYPE_CODES.GRADE_TYPE.PARTIAL,
	final: TYPE_CODES.GRADE_TYPE.FINAL,
};

type SelectOption = { label: string; value: number };
type AnyOption = { label: string; value: string | number };

export function GradeProjectsPage() {
	const { t, locale } = useI18n();
	const { user: authUser } = useAuth();

	const [schoolId, setSchoolId] = useState<number | null>(null);
	const [activeTab, setActiveTab] = useState<RubricTab>('partial');
	const [selectedPeriod, setSelectedPeriod] = useState<SelectOption | null>(null);

	const userId = authUser?.id ?? null;

	useEffect(() => {
		const school = getSchoolCookie();
		setSchoolId(school?.id as number | null);
	}, []);

	const professorEnabled = userId != null;

	const {
		data: professor,
		isLoading: isLoadingProfessor,
		isFetching: isFetchingProfessor,
		isError: isErrorProfessor,
	} = useProfessorByUserId(userId ?? undefined);

	const {
		data: projects = [],
		isLoading: isLoadingProjects,
		isError: isErrorProjects,
		error: projectsError,
	} = useProjectsByProfessor(professor?.id, {
		...(schoolId != null ? { schoolId } : {}),
		...(selectedPeriod != null ? { academicPeriodId: selectedPeriod.value } : {}),
		gradeTypeCode: GRADE_TYPE_CODE[activeTab],
	});

	const { data: academicPeriods = [] } = useAcademicPeriods({ isActive: true });

	const periodOptions = useMemo(
		() => academicPeriods.map((p) => ({ label: p.code, value: p.id })),
		[academicPeriods],
	);

	const isLoading =
		!professorEnabled || isFetchingProfessor || isLoadingProfessor || isLoadingProjects;

	const professorNotFound =
		professorEnabled && !isLoadingProfessor && !isFetchingProfessor && !professor;

	const formatDate = (dateStr: string | undefined) => {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString(locale === 'es' ? 'es-PE' : 'en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const tabs = [
		{ id: 'partial' as const, label: t('projects.grade.tabs.partial') },
		{ id: 'final' as const, label: t('projects.grade.tabs.final') },
	];

	const handleTabChange = (id: string) => {
		setActiveTab(id as RubricTab);
	};

	const handlePeriodChange = (_: string | undefined, opt: AnyOption | AnyOption[] | null) => {
		const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
		setSelectedPeriod(single ? { label: single.label, value: Number(single.value) } : null);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold text-zinc-900">{t('projects.grade.title')}</h1>
				<p className="mt-2 text-zinc-600">{t('projects.grade.description')}</p>
			</div>

			{/* Tabs */}
			<Tabs
				tabs={tabs}
				activeTab={activeTab}
				onChange={handleTabChange}
				ariaLabel={t('projects.grade.tabs.ariaLabel')}
			/>

			{/* Period filter */}
			<div className="w-full max-w-xs">
				<Select
					label={t('projects.grade.filters.academicPeriod')}
					options={periodOptions}
					value={selectedPeriod}
					isClearable
					onChange={handlePeriodChange}
				/>
			</div>

			{/* States */}
			{isLoading ? (
				<div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
					{!professorEnabled || isFetchingProfessor || isLoadingProfessor
						? t('projects.grade.loadingProfessor')
						: t('projects.grade.loading')}
				</div>
			) : isErrorProfessor || professorNotFound ? (
				<TableErrorState message={t('projects.grade.errorProfessor')} />
			) : isErrorProjects ? (
				<TableErrorState
					message={
						projectsError instanceof Error ? projectsError.message : t('projects.grade.error')
					}
				/>
			) : !projects.length ? (
				<TableEmptyState message={t('projects.grade.empty')} />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t('projects.grade.table.code')}</TableHead>
							<TableHead>{t('projects.grade.table.name')}</TableHead>
							<TableHead>{t('projects.grade.table.course')}</TableHead>
							<TableHead>{t('projects.grade.table.evaluator')}</TableHead>
							<TableHead>{t('projects.grade.table.students')}</TableHead>
							<TableHead>{t('projects.grade.table.evaluationDate')}</TableHead>
							<TableHead className="text-center">{t('projects.grade.table.actions')}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{projects.map((project) => (
							<TableRow key={project.projectId}>
								{/* Código */}
								<TableCell>
									<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
										{project.projectCode}
									</span>
								</TableCell>

								{/* Nombre */}
								<TableCell>
									<span className="font-medium text-zinc-900">
										{project.projectName[locale as 'es' | 'en'] ?? project.projectName.es}
									</span>
								</TableCell>

								{/* Curso */}
								<TableCell>
									<span className="text-sm text-zinc-700">{project.courseName}</span>
								</TableCell>

								{/* Evaluador */}
								<TableCell>
									<div className="flex flex-col gap-1 text-sm text-zinc-700">
										{project.evaluators?.length ? (
											project.evaluators.map((ev) => (
												<div key={ev.id} className="flex flex-col gap-0.5">
													<span className="font-medium">
														{ev.firstName} {ev.lastName}
													</span>
													<span className="inline-flex w-fit items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-zinc-500">
														{ev.evaluatorType[locale as 'es' | 'en'] ?? ev.evaluatorType.es}
													</span>
												</div>
											))
										) : (
											<span className="text-zinc-400">—</span>
										)}
									</div>
								</TableCell>

								{/* Estudiantes */}
								<TableCell>
									<div className="flex flex-col gap-0.5 text-sm text-zinc-700">
										{project.students.length ? (
											project.students.map((st) => (
												<div key={st.id} className="flex items-center gap-2">
													<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
													<span>
														{st.firstName} {st.lastName}
													</span>
												</div>
											))
										) : (
											<span className="text-zinc-400">—</span>
										)}
									</div>
								</TableCell>

								{/* Fecha de evaluación */}
								<TableCell>
									<span className="text-sm text-zinc-600">
										{formatDate(project.evaluationDate)}
									</span>
								</TableCell>

								{/* Acciones */}
								<TableCell className="text-center">
									<Link
										href={`/grade-projects/${activeTab}/${project.projectId}/evaluate`}
										title={t('projects.grade.table.grade')}
										className={cn(
											'inline-flex items-center justify-center w-8 h-8 rounded-lg',
											'text-zinc-500 transition-colors',
											'hover:bg-blue-50 hover:text-blue-600',
										)}>
										<ClipboardDocumentCheckIcon className="h-4 w-4" />
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
