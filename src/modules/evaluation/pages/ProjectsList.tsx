'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDownTrayIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import {
	Card,
	DataTable,
	PageHeader,
	TableEmptyState,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose,
	Button,
} from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/Select';
import { buttonVariants } from '@/shared/components/ui/Button';
import { cn } from '@/shared/lib/utils';
import { ApiError } from '@/shared/lib';
import { interpolate, tryTranslateReason } from '@/shared/utils';
import { useI18n, useABET } from '@/providers';
import { usePrograms, useStudyPlanCourses } from '@/modules/academic/hooks';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { DEFAULT_PAGE_SIZE, TYPE_GROUP_CODES } from '@/shared/constants';
import { useDeleteProject, useExportProjectGrades, useProjects } from '../hooks';
import type { ProjectResponse } from '../types';

type SelectOption = { label: string; value: number };
type AnyOption = { label: string; value: string | number };

function toSelectOption(opt: AnyOption | AnyOption[] | null): SelectOption | null {
	const single = Array.isArray(opt) ? (opt[0] ?? null) : opt;
	return single ? { label: single.label, value: Number(single.value) } : null;
}

export function ProjectsListPage() {
	const { t, locale } = useI18n();
	const { academicPeriodId: selectedPeriodId, schoolId } = useABET();

	const [selectedProgram, setSelectedProgram] = useState<SelectOption | null>(null);
	const [selectedCourse, setSelectedCourse] = useState<SelectOption | null>(null);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setPage(1);
	}, [selectedProgram?.value, selectedCourse?.value, debouncedSearch]);

	const { data: programs = [] } = usePrograms(
		{ isActive: true, schoolFilter: true },
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

	const columns = useMemo<ColumnDef<ProjectResponse>[]>(
		() => [
			{
				id: 'code',
				header: t('projects.list.table.code'),
				cell: ({ row }) => (
					<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
						{row.original.code}
					</span>
				),
				meta: { headerClassName: 'w-[10%] !whitespace-normal' },
			},
			{
				id: 'name',
				header: t('projects.list.table.name'),
				cell: ({ row }) => (
					<span className="font-medium text-zinc-900">
						{row.original.name[locale as 'es' | 'en'] ?? row.original.name.es}
					</span>
				),
				meta: {
					headerClassName: 'w-[20%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'course',
				header: t('projects.list.table.course'),
				cell: ({ row }) => {
					const name = row.original.courseName;
					if (!name) return <span className="text-zinc-400">—</span>;
					return (
						<span className="text-sm text-zinc-700">{name[locale as 'es' | 'en'] ?? name.es}</span>
					);
				},
				meta: {
					headerClassName: 'w-[15%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'evaluators',
				header: t('projects.list.table.evaluators'),
				cell: ({ row }) => {
					const evaluators = Object.values(
						(row.original.evaluators ?? []).reduce<
							Record<number, { pid: number; name: string; types: { id: number; label: string }[] }>
						>((acc, ev) => {
							const pid = ev.professorId;
							const name = `${ev.professorFirstName} ${ev.professorLastName}`.trim() || `#${pid}`;
							if (!acc[pid]) acc[pid] = { pid, name, types: [] };
							if (ev.evaluatorTypeName) {
								acc[pid].types.push({
									id: ev.evaluatorTypeId,
									label: ev.evaluatorTypeName[locale as 'es' | 'en'] ?? ev.evaluatorTypeName.es,
								});
							}
							return acc;
						}, {}),
					);
					return evaluators.length ? (
						<div className="flex flex-col gap-1 text-sm text-zinc-700">
							{evaluators.map((entry) => (
								<div key={entry.pid} className="flex flex-col gap-0.5">
									<span className="font-medium">{entry.name}</span>
									<div className="flex flex-wrap gap-1">
										{entry.types.map((tp) => (
											<span
												key={tp.id}
												className="inline-flex items-center rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-zinc-500">
												{tp.label}
											</span>
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<span className="text-zinc-400">—</span>
					);
				},
				meta: {
					headerClassName: 'w-[25%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'students',
				header: t('projects.list.table.students'),
				cell: ({ row }) =>
					row.original.students?.length ? (
						<div className="flex flex-col gap-1 text-sm text-zinc-700">
							{row.original.students.map((st) => (
								<div key={st.id} className="flex items-center gap-2">
									<span className="h-1.5 w-1.5 rounded-full bg-zinc-200" />
									<span>
										{st.studentInfo
											? `${st.studentInfo.firstName} ${st.studentInfo.lastName}`
											: `#${st.studentSectionEnrollmentId}`}
									</span>
								</div>
							))}
						</div>
					) : (
						<span className="text-zinc-400">—</span>
					),
				meta: {
					headerClassName: 'w-[20%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'actions',
				header: t('projects.list.table.actions'),
				cell: ({ row }) => (
					<div className="flex justify-center gap-1">
						<Link
							href={`/academic-projects/projects/${row.original.id}/edit`}
							className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
							title={t('projects.list.table.edit')}>
							<PencilIcon className="h-4 w-4" />
						</Link>
						<button
							type="button"
							onClick={() => {
								setConfirmTarget(row.original);
								setDeleteError(null);
							}}
							disabled={!!row.original.hasEvaluations}
							className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-30"
							title={t('projects.list.table.delete')}>
							<TrashIcon className="h-4 w-4" />
						</button>
					</div>
				),
				meta: {
					headerClassName: 'w-[10%] !whitespace-normal !text-center',
					cellClassName: 'text-center',
				},
			},
		],
		[t, locale, setConfirmTarget, setDeleteError],
	);

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

			<Card>
				<div className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<Select
							label={t('projects.list.filters.program')}
							options={programOptions}
							value={selectedProgram}
							isClearable
							isDisabled={!selectedPeriodId}
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

					{(selectedProgram || selectedCourse) && (
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
			</Card>

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

			<Dialog
				open={exportOpen}
				onOpenChange={(open) => {
					if (!open) {
						setExportOpen(false);
						setExportError(null);
						setSelectedGradeTypeId(null);
					}
				}}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{t('projects.list.exportModal.title')}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Select
							label={t('projects.list.exportModal.gradeTypeLabel')}
							options={gradeTypeOptions}
							value={
								selectedGradeTypeId !== null
									? (gradeTypeOptions.find((o) => o.value === selectedGradeTypeId) ?? null)
									: null
							}
							onChange={(_, opt) => {
								const single = Array.isArray(opt) ? opt[0] : opt;
								if (single) setSelectedGradeTypeId(Number(single.value));
							}}
						/>
						{exportError && <p className="text-xs text-red-600">{exportError}</p>}
					</div>
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={exportMutation.isPending}>
									{t('dialog.close')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							disabled={exportMutation.isPending || !selectedGradeType}
							onClick={() => {
								if (!selectedPeriodId || !schoolId || !selectedGradeType) return;
								setExportError(null);
								const gradeTypeLabel =
									selectedGradeType.name[locale as 'es' | 'en'] ?? selectedGradeType.name.es;
								const sanitizedGradeType = gradeTypeLabel.trim().replace(/\s+/g, '-').toLowerCase();
								const filename = `${t('projects.list.exportModal.filename')}-${sanitizedGradeType}.xlsx`;
								exportMutation.mutate(
									{
										gradeTypeCode: selectedGradeType.code,
										filename,
									},
									{
										onSuccess: () => setExportOpen(false),
										onError: () => setExportError(t('projects.list.exportModal.error')),
									},
								);
							}}>
							{exportMutation.isPending
								? t('projects.list.exportModal.exporting')
								: t('projects.list.exportModal.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!confirmTarget}
				onOpenChange={(open) => {
					if (!open) {
						setConfirmTarget(null);
						setDeleteError(null);
					}
				}}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{t('projects.list.deleteModal.title')}</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-zinc-600">
						{interpolate(t('projects.list.deleteModal.body'), {
							name: confirmTarget
								? (confirmTarget.name[locale as 'es' | 'en'] ?? confirmTarget.name.es)
								: '',
						})}
					</p>
					{deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary" disabled={deleteMutation.isPending}>
									{t('dialog.close')}
								</Button>
							}
						/>
						<Button
							variant="primary"
							className="bg-red-600 hover:bg-red-700"
							disabled={deleteMutation.isPending}
							onClick={() => {
								if (!confirmTarget) return;
								setDeleteError(null);
								deleteMutation.mutate(confirmTarget.id, {
									onSuccess: () => setConfirmTarget(null),
									onError: (err: unknown) => {
										const hasEvaluations =
											err instanceof ApiError && err.message === 'error.project.hasEvaluations';
										setDeleteError(
											hasEvaluations
												? t('projects.list.deleteModal.errorHasEvaluations')
												: t('projects.list.deleteModal.errorGeneric'),
										);
									},
								});
							}}>
							{deleteMutation.isPending
								? t('projects.list.deleteModal.deleting')
								: t('projects.list.deleteModal.confirm')}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
