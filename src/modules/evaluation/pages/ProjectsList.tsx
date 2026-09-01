'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDownTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Button, DataTable, PageHeader, TableEmptyState } from '@/shared/components/ui';
import { buttonVariants } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { tryTranslateReason } from '@/shared/utils';
import { useI18n, useABET } from '@/providers';
import { usePrograms, useStudyPlanCourses } from '@/modules/academic/hooks';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { DEFAULT_PAGE_SIZE, TYPE_GROUP_CODES } from '@/shared/constants';
import { useDeleteProject, useExportProjectGrades, useProjects, useProjectGroups } from '../hooks';
import type { ProjectResponse } from '../types';
import { ProjectsListFilters } from '../components/projects-list/ProjectsListFilters';
import { useProjectsColumns } from '../components/projects-list/useProjectsColumns';
import { ExportGradesDialog } from '../components/projects-list/ExportGradesDialog';
import { DeleteProjectDialog } from '../components/projects-list/DeleteProjectDialog';
import { toSelectOption, type SelectOption, type AnyOption } from '../utils/selectOption';

export function ProjectsListPage() {
	const { t, locale } = useI18n();
	const { academicPeriodId: selectedPeriodId, schoolId, modalityTypeId } = useABET();

	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);
	const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null);
	const [selectedGroup, setSelectedGroup] = useState<SelectOption | null>(null);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	useEffect(() => {
		/* eslint-disable react-hooks/set-state-in-effect -- clear the program/course/group filters when the global school/period/modality context changes so stale selections aren't queried */
		setSelectedProgram(null);
		setSelectedCourse(null);
		setSelectedGroup(null);
		/* eslint-enable react-hooks/set-state-in-effect */
	}, [schoolId, selectedPeriodId, modalityTypeId]);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset to page 1 whenever the program/course/group filter or search term changes so paging starts fresh
		setPage(1);
	}, [selectedProgram?.value, selectedCourse?.value, selectedGroup?.value, debouncedSearch]);

	const { data: programs = [] } = usePrograms(
		{
			isActive: true,
			schoolFilter: true,
			useAcademicPeriod: true,
			modalityTypeId: modalityTypeId ?? undefined,
		},
		{ enabled: !!selectedPeriodId && !!schoolId },
	);

	const { data: evaluableSpcList = [] } = useStudyPlanCourses(
		{
			programId: selectedProgram?.value,
			extra: { isEvaluable: true },
			isActive: true,
		},
		{ enabled: !!selectedPeriodId && !!selectedProgram && !!schoolId },
	);

	const { data: groups = [] } = useProjectGroups(
		{
			programId: selectedProgram?.value,
			isActive: true,
		},
		{ enabled: !!selectedPeriodId && !!schoolId && !!selectedProgram },
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
			...(selectedGroup ? { projectGroupId: selectedGroup.value } : {}),
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

	const groupOptions = useMemo(
		() =>
			groups.map((g) => ({
				label: `${g.code} — ${g.name[locale as 'es' | 'en'] ?? g.name.es}`,
				value: g.id,
			})),
		[groups, locale],
	);

	const handleProgramChange = (_: string | undefined, opt: AnyOption | AnyOption[] | null) => {
		setSelectedProgram(toSelectOption(opt));
		setSelectedCourse(null);
		setSelectedGroup(null);
	};

	const handleCourseChange = (_: string | undefined, opt: AnyOption | AnyOption[] | null) => {
		setSelectedCourse(toSelectOption(opt));
	};

	const handleGroupChange = (_: string | undefined, opt: AnyOption | AnyOption[] | null) => {
		setSelectedGroup(toSelectOption(opt));
	};

	const [confirmTarget, setConfirmTarget] = useState<ProjectResponse | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const deleteMutation = useDeleteProject();

	const [exportOpen, setExportOpen] = useState(false);
	const [selectedCompetencyScopeId, setSelectedCompetencyScopeId] = useState<number | null>(null);
	const [exportError, setExportError] = useState<string | null>(null);
	const exportMutation = useExportProjectGrades();

	const { data: competencyScopeTypes = [] } = useTypesByGroupCode(
		TYPE_GROUP_CODES.COMPETENCY_SCOPE,
		{
			enabled: exportOpen,
		},
	);

	const competencyScopeOptions = useMemo(
		() =>
			competencyScopeTypes.map((cs) => ({
				label: cs.name[locale as 'es' | 'en'] ?? cs.name.es,
				value: cs.id,
			})),
		[competencyScopeTypes, locale],
	);

	const selectedCompetencyScope =
		competencyScopeTypes.find((cs) => cs.id === selectedCompetencyScopeId) ?? null;

	const handleClearFilters = () => {
		setSelectedProgram(null);
		setSelectedCourse(null);
		setSelectedGroup(null);
	};

	const columns = useProjectsColumns({ setConfirmTarget, setDeleteError });

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('projects.list.title')}
				description={t('projects.list.description')}
				action={
					<>
						<Button
							variant="secondary"
							onClick={() => {
								setExportError(null);
								setExportOpen(true);
							}}
							disabled={!selectedPeriodId || !schoolId}>
							<ArrowDownTrayIcon className="h-4 w-4" />
							{t('projects.list.exportButton')}
						</Button>
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
				groupOptions={groupOptions}
				selectedProgram={selectedProgram}
				selectedCourse={selectedCourse}
				selectedGroup={selectedGroup}
				selectedPeriodId={selectedPeriodId}
				onProgramChange={handleProgramChange}
				onCourseChange={handleCourseChange}
				onGroupChange={handleGroupChange}
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
						setSelectedCompetencyScopeId(null);
					}
				}}
				competencyScopeOptions={competencyScopeOptions}
				selectedCompetencyScopeId={selectedCompetencyScopeId}
				setSelectedCompetencyScopeId={setSelectedCompetencyScopeId}
				selectedCompetencyScope={selectedCompetencyScope}
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
