'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PencilIcon } from '@heroicons/react/24/outline';
import {
	Table,
	TableBody,
	TableCell,
	TableEmptyState,
	TableErrorState,
	TableHead,
	TableHeader,
	TableRow,
} from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { buttonVariants } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { useI18n } from '@/providers';
import { getSchoolCookie } from '@/shared/lib';
import {
	academicPeriodsService,
	programsService,
	coursesService,
} from '@/modules/academic/services';
import { projectsService } from '../services';
import { TrashIcon } from 'lucide-react';

type SelectOption = { label: string; value: number };

export function ProjectsListPage() {
	const { t, locale } = useI18n();
	const [schoolId, setSchoolId] = useState<number | null>(null);
	const [selectedPeriod, setSelectedPeriod] = useState<SelectOption | null>(null);
	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);
	const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null);

	useEffect(() => {
		const school = getSchoolCookie();
		setSchoolId(school?.id as number | null);
	}, []);

	const { data: academicPeriods = [] } = useQuery({
		queryKey: ['academic-periods', 'filtered', { is_active: true }],
		queryFn: () => academicPeriodsService.getByFilters({ is_active: true }).then((r) => r.data),
	});

	const { data: programs = [] } = useQuery({
		queryKey: [
			'programs',
			'filtered',
			{ school_id: schoolId, academic_period_id: selectedPeriod?.value, is_active: true },
		],
		queryFn: () =>
			programsService
				.getByFilters({
					school_id: schoolId!,
					academic_period_id: selectedPeriod!.value,
					is_active: true,
				})
				.then((r) => r.data),
		enabled: !!selectedPeriod && !!schoolId,
	});

	const { data: courses = [] } = useQuery({
		queryKey: [
			'courses',
			'filtered',
			{
				school_id: schoolId,
				academic_period_id: selectedPeriod?.value,
				program_id: selectedProgram?.value,
				is_active: true,
			},
		],
		queryFn: () =>
			coursesService
				.getByFilters({
					school_id: schoolId!,
					academic_period_id: selectedPeriod!.value,
					program_id: selectedProgram!.value,
					is_active: true,
				})
				.then((r) => r.data),
		enabled: !!selectedPeriod && !!selectedProgram && !!schoolId,
	});

	const {
		data: projects = [],
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: [
			'projects',
			'filtered',
			{
				school_id: schoolId,
				academic_period_id: selectedPeriod?.value,
				program_id: selectedProgram?.value,
				course_id: selectedCourse?.value,
			},
		],
		queryFn: () =>
			projectsService
				.getByFilters({
					school_id: schoolId!,
					...(selectedPeriod ? { academic_period_id: selectedPeriod.value } : {}),
					...(selectedProgram ? { program_id: selectedProgram.value } : {}),
					...(selectedCourse ? { course_id: selectedCourse.value } : {}),
				})
				.then((r) => r.data),
		enabled: !!schoolId,
	});

	const periodOptions = useMemo(
		() => academicPeriods.map((p) => ({ label: p.code, value: p.id })),
		[academicPeriods],
	);

	const programOptions = useMemo(
		() => programs.map((p) => ({ label: p.name[locale as 'es' | 'en'] ?? p.name.es, value: p.id })),
		[programs, locale],
	);

	const courseOptions = useMemo(
		() => courses.map((c) => ({ label: c.name[locale as 'es' | 'en'] ?? c.name.es, value: c.id })),
		[courses, locale],
	);

	const handlePeriodChange = (_: string | undefined, opt: any) => {
		setSelectedPeriod(opt ? { label: String(opt.label), value: Number(opt.value) } : null);
		setSelectedProgram(null);
		setSelectedCourse(null);
	};

	const handleProgramChange = (_: string | undefined, opt: any) => {
		setSelectedProgram(opt ? { label: String(opt.label), value: Number(opt.value) } : null);
		setSelectedCourse(null);
	};

	const handleCourseChange = (_: string | undefined, opt: any) => {
		setSelectedCourse(opt ? { label: String(opt.label), value: Number(opt.value) } : null);
	};

	const handleClearFilters = () => {
		setSelectedPeriod(null);
		setSelectedProgram(null);
		setSelectedCourse(null);
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold text-zinc-900">{t('projects.list.title')}</h1>
					<p className="mt-2 text-zinc-600">{t('projects.list.description')}</p>
				</div>
				<Link
					href="/projects/new"
					className={cn(buttonVariants({ variant: 'primary', size: 'md' }), 'shrink-0')}>
					{t('projects.list.addButton')}
				</Link>
			</div>

			<div className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<Select
						label={t('projects.list.filters.academicPeriod')}
						options={periodOptions}
						value={selectedPeriod}
						isClearable
						onChange={handlePeriodChange}
					/>
					<Select
						label={t('projects.list.filters.program')}
						options={programOptions}
						value={selectedProgram}
						isClearable
						isDisabled={!selectedPeriod}
						onChange={handleProgramChange}
					/>
					<Select
						label={t('projects.list.filters.course')}
						options={courseOptions}
						value={selectedCourse}
						isClearable
						isDisabled={!selectedProgram}
						onChange={handleCourseChange}
					/>
				</div>

				{(selectedPeriod || selectedProgram || selectedCourse) && (
					<div className="flex justify-end">
						<button
							type="button"
							onClick={handleClearFilters}
							className={cn(
								buttonVariants({ variant: 'warning', size: 'md' }),
								'inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-red-100 hover:text-red-500',
							)}>
							<TrashIcon className="h-4 w-4" />
							{t('projects.list.clearFilters')}
						</button>
					</div>
				)}
			</div>

			{isLoading ? (
				<div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 shadow-sm">
					{t('projects.list.loading')}
				</div>
			) : isError ? (
				<TableErrorState
					message={error instanceof Error ? error.message : t('projects.list.error')}
				/>
			) : !projects.length ? (
				<TableEmptyState message={t('projects.list.empty')} />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t('projects.list.table.code')}</TableHead>
							<TableHead>{t('projects.list.table.name')}</TableHead>
							<TableHead>{t('projects.list.table.evaluators')}</TableHead>
							<TableHead>{t('projects.list.table.students')}</TableHead>
							<TableHead className="!text-center">{t('projects.list.table.actions')}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{projects.map((project) => (
							<TableRow key={project.id}>
								<TableCell>
									<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
										{project.code}
									</span>
								</TableCell>
								<TableCell>
									<span className="font-medium text-zinc-900">
										{project.name[locale as 'es' | 'en'] ?? project.name.es}
									</span>
								</TableCell>
								<TableCell>
									<div className="flex flex-col gap-0.5">
										{project.evaluators?.length ? (
											project.evaluators.map((ev) => (
												<div key={ev.id} className="flex items-center gap-2">
													<span className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
													<span>
														{ev.evaluator_info
															? `${ev.evaluator_info.first_name} ${ev.evaluator_info.last_name}`
															: `#${ev.professor_id}`}
													</span>
												</div>
											))
										) : (
											<span className="text-zinc-400 text-sm">—</span>
										)}
									</div>
								</TableCell>
								<TableCell>
									<div className="flex flex-col gap-0.5">
										<div className="flex flex-col gap-1 text-sm text-zinc-700">
											{project.students?.length ? (
												project.students.map((st) => (
													<div key={st.id} className="flex items-center gap-2">
														<span className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
														<span>
															{st.student_info
																? `${st.student_info.first_name} ${st.student_info.last_name}`
																: `#${st.student_section_enrollment_id}`}
														</span>
													</div>
												))
											) : (
												<span className="text-zinc-400">—</span>
											)}
										</div>
									</div>
								</TableCell>
								<TableCell className="text-center">
									<div className="flex justify-center">
										<Link
											href={`/projects/${project.id}/edit`}
											className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
											title={t('projects.list.table.edit')}>
											<PencilIcon className="h-4 w-4" />
										</Link>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
