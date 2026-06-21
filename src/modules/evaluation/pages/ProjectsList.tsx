'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import { DataTable, PageHeader, TableEmptyState } from '@/shared/components/ui';
import { buttonVariants } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { tryTranslateReason } from '@/shared/utils';
import { useI18n, useABET } from '@/providers';
import { usePrograms, useStudyPlanCourses } from '@/modules/academic/hooks';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { DEFAULT_PAGE_SIZE, TYPE_GROUP_CODES } from '@/shared/constants';
import { useDeleteProject, useExportProjectGrades, useProjects } from '../hooks';
import type { ProjectResponse } from '../types';
import { ProjectsListFilters } from '../components/projects-list/ProjectsListFilters';
import { useProjectsColumns } from '../components/projects-list/useProjectsColumns';
import { ExportGradesDialog } from '../components/projects-list/ExportGradesDialog';
import { DeleteProjectDialog } from '../components/projects-list/DeleteProjectDialog';

type SelectOption = { label: string; value: number };
type AnyOption = { label: string; value: string | number };

function toSelectOption(opt: AnyOption | AnyOption[] | null): SelectOption | null {
	const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
	return single ? { label: single.label, value: Number(single.value) } : null;
}

export function ProjectsListPage() {
	const { t, locale } = useI18n();
	const { academicPeriodId: selectedPeriodId, schoolId, modalityTypeId } = useABET();

	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);
	const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	useEffect(() => {
		setSelectedProgram(null);
		setSelectedCourse(null);
	}, [schoolId, selectedPeriodId, modalityTypeId]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setPage(1);
	}, [selectedProgram?.value, selectedCourse?.value, debouncedSearch]);

	const { data: programs = [] } = usePrograms(
		{ isActive: true, schoolFilter: true, modalityTypeId: modalityTypeId ?? undefined },
		{ enabled: !!selectedPeriodId && !!schoolId },
	);

	const { data: evaluableSpcList = [] } = useStudyPlanCourses(
		{
			programId: selectedProgram?.value,
			// NOTE: Backend field is "is_evaluable" (snake_case), do NOT convert to camelCase
			extra: { is_evaluable: true },
			isActive: true,
		},
		{ enabled: !!selectedPeriodId && !!selectedProgram && !!schoolId },
	);

	const {
		data: projectsData,
		isLoading,
		isFetching,
		isError,
		error,
	} = useProjects(
		{
			...(selectedProgram ? { programId: selectedProgram.value } : {}),
			...(selectedCourse ? { courseId: selectedCourse.value } : {}),
			...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
			page,
			pageSize: DEFAULT_PAGE_SIZE,
		},
		{ enabled: !!selectedPeriodId && !!schoolId && !!selectedProgram },
	);

	const projects = projectsData?.items ?? [];
	const totalPages = projectsData?.totalPages ?? 1;
	const total = projectsData?.total ?? 0;

	const programOptions = useMemo(
		() => programs.map((p) => ({ label: p.name[locale as 'es' | 'en'] ?? p.name.es, value: p.id })),
		[programs, locale],
	);

	const courseOptions = useMemo(
		() =>
			evaluableSpcList.map((spc) => {
				const name = spc.course?.name;
				const label =
					(typeof name === 'string' ? name : (name?.[locale as 'es' | 'en'] ?? name?.es)) ??
					String(spc.courseId);
				return { label, value: spc.courseId };
			}),
		[evaluableSpcList, locale],
	);

	const handleProgramChange = (_: string | undefined, opt: AnyOption | AnyOption[] | null) => {
		setSelectedProgram(toSelectOption(opt));
		setSelectedCourse(null);
	};

	const handleCourseChange = (_: string | undefined, opt: AnyOption | AnyOption[] | null) => {
		setSelectedCourse(toSelectOption(opt));
	};

	const [confirmTarget, setConfirmTarget] = useState<ProjectResponse | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const deleteMutation = useDeleteProject();

	const [exportOpen, setExportOpen] = useState(false);
	const [selectedGradeTypeId, setSelectedGradeTypeId] = useState<number | null>(null);
	const [exportError, setExportError] = useState<string | null>(null);
	const exportMutation = useExportProjectGrades();

	const { data: gradeTypes = [], isLoading: loadingGradeTypes } = useTypesByGroupCode(
		TYPE_GROUP_CODES.GRADE_TYPE,
		{ enabled: exportOpen },
	);

	const gradeTypeOptions = useMemo(
		() =>
			gradeTypes.map((gt) => ({
				label: gt.name[locale as 'es' | 'en'] ?? gt.name.es,
				value: gt.id,
			})),
		[gradeTypes, locale],
	);

	const selectedGradeType = gradeTypes.find((gt) => gt.id === selectedGradeTypeId) ?? null;

	const handleClearFilters = () => {
		setSelectedProgram(null);
		setSelectedCourse(null);
	};

	const columns = useProjectsColumns({ setConfirmTarget, setDeleteError });

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('projects.list.title')}
				description={t('projects.list.description')}
				action={
					<>
						<button
							type="button"
							onClick={() => {
								setExportError(null);
								setExportOpen(true);
							}}
							disabled={!selectedPeriodId || !schoolId}
							className={cn(
								buttonVariants({ variant: 'secondary', size: 'md' }),
								'inline-flex items-center gap-1.5 disabled:pointer-events-none disabled:opacity-50',
							)}>
							<ArrowDownTrayIcon className="h-4 w-4" />
							{t('projects.list.exportButton')}
						</button>
						<Link
							href="/academic-projects/projects/new"
							className={cn(
								buttonVariants({ variant: 'primary', size: 'md' }),
								'inline-flex items-center gap-1.5',
							)}>
							<PlusIcon className="h-4 w-4" />
							{t('projects.list.addButton')}
						</Link>
					</>
				}
			/>

			<ProjectsListFilters
				programOptions={programOptions}
				courseOptions={courseOptions}
				selectedProgram={selectedProgram}
				selectedCourse={selectedCourse}
				selectedPeriodId={selectedPeriodId}
				onProgramChange={handleProgramChange}
				onCourseChange={handleCourseChange}
				onClearFilters={handleClearFilters}
			/>

			{!selectedProgram ? (
				<TableEmptyState message={t('projects.list.selectProgram')} />
			) : (
				<DataTable
					columns={columns}
					data={projects}
					isLoading={isLoading}
					errorMessage={
						isError
							? tryTranslateReason(
									t,
									error instanceof Error ? error.message : 'projects.list.error',
								)
							: undefined
					}
					emptyMessage={t('projects.list.empty')}
					searchValue={search}
					onSearchChange={setSearch}
					serverPagination={{
						page,
						pageCount: totalPages,
						total,
						onPageChange: setPage,
						isFetching,
					}}
					tableClassName="table-fixed min-w-[1400px]"
				/>
			)}

			<ExportGradesDialog
				open={exportOpen}
				onOpenChange={(open) => {
					if (!open) {
						setExportOpen(false);
						setExportError(null);
						setSelectedGradeTypeId(null);
					}
				}}
				gradeTypeOptions={gradeTypeOptions}
				selectedGradeTypeId={selectedGradeTypeId}
				setSelectedGradeTypeId={setSelectedGradeTypeId}
				selectedGradeType={selectedGradeType}
				exportError={exportError}
				setExportError={setExportError}
				exportMutation={exportMutation}
				selectedPeriodId={selectedPeriodId}
				schoolId={schoolId}
				setExportOpen={setExportOpen}
			/>

			<DeleteProjectDialog
				confirmTarget={confirmTarget}
				onOpenChange={(open) => {
					if (!open) {
						setConfirmTarget(null);
						setDeleteError(null);
					}
				}}
				deleteError={deleteError}
				setDeleteError={setDeleteError}
				deleteMutation={deleteMutation}
				setConfirmTarget={setConfirmTarget}
			/>
		</div>
	);
}
