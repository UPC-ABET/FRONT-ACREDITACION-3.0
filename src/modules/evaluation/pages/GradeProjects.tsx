'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
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
import { useAuth, useI18n } from '@/providers';
import { getSchoolCookie } from '@/shared/lib';
import { academicPeriodsService } from '@/modules/academic/services';
import { useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectsByProfessor } from '../hooks';
import { GRADE_IDS } from '../constants/typeCodes';

type RubricTab = 'partial' | 'final';

const GRADE_TYPE_ID: Record<RubricTab, number> = {
	partial: GRADE_IDS.PARTIAL, //EA
	final: GRADE_IDS.FINAL, //EB
};

type SelectOption = { label: string; value: number };

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
		gradeTypeId: GRADE_TYPE_ID[activeTab],
	});

	const { data: academicPeriods = [] } = useQuery({
		queryKey: ['academic-periods', 'filtered', { is_active: true }],
		queryFn: () => academicPeriodsService.getByFilters({ is_active: true }).then((r) => r.data),
	});

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

	const handlePeriodChange = (_: string | undefined, opt: any) => {
		setSelectedPeriod(opt ? { label: String(opt.label), value: Number(opt.value) } : null);
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
							<TableRow key={project.project_id}>
								{/* Código */}
								<TableCell>
									<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
										{project.project_code}
									</span>
								</TableCell>

								{/* Nombre */}
								<TableCell>
									<span className="font-medium text-zinc-900">
										{project.project_name[locale as 'es' | 'en'] ?? project.project_name.es}
									</span>
								</TableCell>

								{/* Curso */}
								<TableCell>
									<span className="text-sm text-zinc-700">{project.course_name}</span>
								</TableCell>

								{/* Evaluador */}
								<TableCell>
									<div className="flex flex-col gap-1 text-sm text-zinc-700">
										{project.evaluators?.length ? (
											project.evaluators.map((ev) => (
												<div key={ev.id} className="flex flex-col gap-0.5">
													<span className="font-medium">
														{ev.first_name} {ev.last_name}
													</span>
													<span className="inline-flex w-fit items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-zinc-500">
														{ev.evaluator_type[locale as 'es' | 'en'] ?? ev.evaluator_type.es}
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
														{st.first_name} {st.last_name}
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
										{formatDate(project.evaluation_date)}
									</span>
								</TableCell>

								{/* Acciones */}
								<TableCell className="text-center">
									<Link
										href={`/grade-projects/${activeTab}/${project.project_id}/evaluate`}
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
