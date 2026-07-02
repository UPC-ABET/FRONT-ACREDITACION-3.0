'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTabParam } from '@/shared';
import Link from 'next/link';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import {
	buttonVariants,
	DataTable,
	PageHeader,
	TableErrorState,
	TableLoadingState,
	Tabs,
} from '@/shared/components/ui';
import { cn } from '@/shared/lib/utils';
import { useI18n, useABET } from '@/providers';
import { useAuth } from '@/providers';
import { useProfessorByUserId } from '@/modules/academic/hooks';
import { useProjectsByProfessor } from '../hooks';
import { DEFAULT_PAGE_SIZE, TYPE_CODES } from '@/shared/constants';
import type { ProjectByProfessorResponse } from '../types';

type RubricTab = 'partial' | 'final';

const COMPETENCY_SCOPE_CODE: Record<RubricTab, string> = {
	partial: TYPE_CODES.COMPETENCY_SCOPE.SINGLE,
	final: TYPE_CODES.COMPETENCY_SCOPE.MULTIPLE,
};

export function GradeProjectsPage() {
	const { t, locale } = useI18n();
	const { user: authUser } = useAuth();
	const { academicPeriodId: selectedPeriodId } = useABET();

	const [tabParam, setTab] = useTabParam('partial');
	const activeTab: RubricTab = tabParam === 'final' ? 'final' : 'partial';
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		setPage(1);
	}, [activeTab, debouncedSearch]);

	const userId = authUser?.id ?? null;
	const professorEnabled = userId != null;

	const {
		data: professor,
		isLoading: isLoadingProfessor,
		isFetching: isFetchingProfessor,
		isError: isErrorProfessor,
	} = useProfessorByUserId(userId ?? undefined);

	const {
		data: projectsData,
		isLoading: isLoadingProjects,
		isFetching: isFetchingProjects,
		isError: isErrorProjects,
		error: projectsError,
	} = useProjectsByProfessor(
		professor?.id,
		{
			competencyScopeCode: COMPETENCY_SCOPE_CODE[activeTab],
			page,
			pageSize: DEFAULT_PAGE_SIZE,
			search: debouncedSearch.trim() || undefined,
		},
		{ enabled: selectedPeriodId !== null },
	);

	const projects = projectsData?.items ?? [];
	const totalPages = projectsData?.totalPages ?? 1;
	const total = projectsData?.total ?? 0;

	const isProfessorLoading = !professorEnabled || isLoadingProfessor || isFetchingProfessor;
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

	const columns = useMemo<ColumnDef<ProjectByProfessorResponse>[]>(
		() => [
			{
				id: 'code',
				header: t('projects.grade.table.code'),
				cell: ({ row }) => (
					<span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 font-mono text-xs font-medium text-zinc-700">
						{row.original.projectCode}
					</span>
				),
				meta: { headerClassName: 'w-[10%] !whitespace-normal' },
			},
			{
				id: 'name',
				header: t('projects.grade.table.name'),
				cell: ({ row }) => (
					<span className="font-medium text-zinc-900">
						{row.original.projectName[locale as 'es' | 'en'] ?? row.original.projectName.es}
					</span>
				),
				meta: {
					headerClassName: 'w-[15%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'course',
				header: t('projects.grade.table.course'),
				cell: ({ row }) => <span className="text-zinc-700">{row.original.courseName}</span>,
				meta: {
					headerClassName: 'w-[13%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'evaluator',
				header: t('projects.grade.table.evaluator'),
				cell: ({ row }) => {
					const evaluators = Object.values(
						(row.original.evaluators ?? []).reduce<
							Record<number, { name: string; types: { id: number; label: string }[] }>
						>((acc, ev) => {
							const pid = ev.professorId;
							if (!acc[pid]) acc[pid] = { name: `${ev.firstName} ${ev.lastName}`, types: [] };
							if (ev.evaluatorType) {
								acc[pid].types.push({
									id: ev.id,
									label: ev.evaluatorType[locale as 'es' | 'en'] ?? ev.evaluatorType.es,
								});
							}
							return acc;
						}, {}),
					);
					return evaluators.length ? (
						<div className="flex flex-col gap-1 text-zinc-700">
							{evaluators.map((entry) => (
								<div key={entry.name} className="flex flex-col gap-0.5">
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
					headerClassName: 'w-[22%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'students',
				header: t('projects.grade.table.students'),
				cell: ({ row }) =>
					row.original.students.length ? (
						<div className="flex flex-col gap-0.5 text-zinc-700">
							{row.original.students.map((st) => (
								<div key={st.id} className="flex items-center gap-2">
									<span className="h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300" />
									<span>
										{st.firstName} {st.lastName}
									</span>
								</div>
							))}
						</div>
					) : (
						<span className="text-zinc-400">—</span>
					),
				meta: {
					headerClassName: 'w-[21%] !whitespace-normal',
					cellClassName: '!whitespace-normal',
				},
			},
			{
				id: 'evaluationDate',
				header: t('projects.grade.table.evaluationDate'),
				cell: ({ row }) => (
					<span className="text-zinc-600">{formatDate(row.original.evaluationDate)}</span>
				),
				meta: { headerClassName: 'w-[10%] !whitespace-normal' },
			},
			{
				id: 'actions',
				header: t('projects.grade.table.actions'),
				cell: ({ row }) => (
					<Link
						href={`/evaluation/grade-projects/${activeTab}/${row.original.projectId}/evaluate`}
						aria-label={t('projects.grade.table.grade')}
						title={t('projects.grade.table.grade')}
						className={cn(
							buttonVariants({ variant: 'ghost', size: 'icon' }),
							'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
						)}>
						<ClipboardDocumentCheckIcon className="h-5 w-5" />
					</Link>
				),
				meta: {
					headerClassName: 'w-[8%] text-right',
					cellClassName: 'text-right',
				},
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- formatDate is a render-local helper that only closes over locale (already a dep); depending on it would rebuild the columns every render
		[t, locale, activeTab],
	);

	const tabs = [
		{ id: 'partial' as const, label: t('projects.grade.tabs.partial') },
		{ id: 'final' as const, label: t('projects.grade.tabs.final') },
	];

	return (
		<div className="space-y-6">
			<PageHeader title={t('projects.grade.title')} description={t('projects.grade.description')} />

			<Tabs
				tabs={tabs}
				activeTab={activeTab}
				onChange={setTab}
				ariaLabel={t('projects.grade.tabs.ariaLabel')}
			/>

			{isProfessorLoading ? (
				<TableLoadingState label={t('projects.grade.loadingProfessor')} />
			) : isErrorProfessor || professorNotFound ? (
				<TableErrorState message={t('projects.grade.errorProfessor')} />
			) : (
				<DataTable
					columns={columns}
					data={projects}
					isLoading={isLoadingProjects}
					errorMessage={
						isErrorProjects
							? projectsError instanceof Error
								? projectsError.message
								: t('projects.grade.error')
							: undefined
					}
					emptyMessage={t('projects.grade.empty')}
					searchValue={search}
					onSearchChange={setSearch}
					serverPagination={{
						page,
						pageCount: totalPages,
						total,
						onPageChange: setPage,
						isFetching: isFetchingProjects,
					}}
					tableClassName="table-fixed min-w-[1400px]"
				/>
			)}
		</div>
	);
}
