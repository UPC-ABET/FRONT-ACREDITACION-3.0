'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import {
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	Select,
	SubTitle,
	Title,
	Toast,
} from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import {
	useClassRepresentativeMutations,
	useClassRepresentativesMaintenance,
	useProgramsByModality,
} from '../hooks';
import type { ClassRepresentativeMaintenanceItem, ProgramResponse } from '../types';
import { ClassRepresentativeCreateDialog } from './ClassRepresentativeCreateDialog';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function ClassRepresentativesMaintenance() {
	const { t, locale } = useI18n();
	const { academicPeriodId, modalityTypeId } = useABET();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const { data: programs = [] } = useProgramsByModality(modalityTypeId);

	const [programId, setProgramId] = useState<number | null>(null);
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [pendingRemove, setPendingRemove] = useState<ClassRepresentativeMaintenanceItem | null>(
		null,
	);

	const { assign, remove } = useClassRepresentativeMutations();

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging to the first page when the external academic period changes
		setPage(1);
	}, [academicPeriodId]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleProgramChange = (value: number | null) => {
		setProgramId(value);
		setPage(1);
	};

	const { data, isLoading, isFetching, isError } = useClassRepresentativesMaintenance({
		academicPeriodId,
		programId,
		page,
		pageSize: PAGE_SIZE,
		search: debouncedSearch,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	const programOptions = useMemo(
		() =>
			programs.map((program: ProgramResponse) => ({
				value: program.id,
				label: localized(program.name, locale) || program.code,
			})),
		[programs, locale],
	);
	const selectedProgram = programOptions.find((option) => option.value === programId) ?? null;

	const handleAssign = async (body: { sectionCode: string; studentCode: string }) => {
		setCreateError(null);
		try {
			await assign.mutateAsync(body);
			showToast('loads.classRepresentativesMaintenance.toast.assigned', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.classRepresentativesMaintenance.create.error'),
				),
			);
		}
	};

	const handleConfirmRemove = async () => {
		if (!pendingRemove) return;
		try {
			await remove.mutateAsync({
				studentCode: pendingRemove.studentCode,
				sectionCode: pendingRemove.sectionCode,
			});
			showToast('loads.classRepresentativesMaintenance.toast.removed', 'success');
			setPendingRemove(null);
		} catch (error) {
			setPendingRemove(null);
			showToast(
				getErrorMessage(error, 'loads.classRepresentativesMaintenance.remove.error'),
				'error',
			);
		}
	};

	const noPeriodSelected = academicPeriodId == null;

	const columns = useMemo<ColumnDef<ClassRepresentativeMaintenanceItem>[]>(
		() => [
			{
				id: 'courseName',
				header: t('loads.classRepresentativesMaintenance.col.courseName'),
				meta: { cellClassName: 'font-medium text-zinc-900' },
				cell: ({ row }) => localized(row.original.courseName, locale),
			},
			{
				accessorKey: 'courseCode',
				header: t('loads.classRepresentativesMaintenance.col.courseCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				accessorKey: 'sectionCode',
				header: t('loads.classRepresentativesMaintenance.col.sectionCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				accessorKey: 'studentCode',
				header: t('loads.classRepresentativesMaintenance.col.studentCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				id: 'studentName',
				header: t('loads.classRepresentativesMaintenance.col.studentName'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => `${row.original.studentFirstName} ${row.original.studentLastName}`,
			},
			{
				id: 'actions',
				header: t('loads.classRepresentativesMaintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end">
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingRemove(row.original)}
							aria-label={t('loads.classRepresentativesMaintenance.actions.remove')}
							title={t('loads.classRepresentativesMaintenance.actions.remove')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
			},
		],
		[t, locale],
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.classRepresentativesMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.classRepresentativesMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<DataTable
					columns={columns}
					data={items}
					searchPlaceholder={t('loads.classRepresentativesMaintenance.searchPlaceholder')}
					searchValue={search}
					onSearchChange={handleSearchChange}
					filters={
						<div className="w-full sm:w-56">
							<Select
								name="program"
								aria-label={t('loads.classRepresentativesMaintenance.programLabel')}
								placeholder={t('loads.classRepresentativesMaintenance.programPlaceholder')}
								isSearchable
								isClearable
								isDisabled={noPeriodSelected}
								options={programOptions}
								value={selectedProgram}
								onChange={(_name, value) =>
									handleProgramChange(value && !Array.isArray(value) ? Number(value.value) : null)
								}
							/>
						</div>
					}
					aria-label={t('loads.classRepresentativesMaintenance.title')}
					isLoading={isLoading}
					errorMessage={
						isError ? t('loads.classRepresentativesMaintenance.error.loadFailed') : undefined
					}
					emptyMessage={
						noPeriodSelected
							? t('loads.classRepresentativesMaintenance.selectPeriod')
							: t('loads.classRepresentativesMaintenance.empty.title')
					}
					serverPagination={{
						page,
						pageCount: totalPages,
						total,
						onPageChange: setPage,
						isFetching,
					}}
					actions={[
						{
							label: t('loads.classRepresentativesMaintenance.actions.new'),
							onClick: () => {
								setCreateError(null);
								setCreating(true);
							},
							icon: <PlusIcon className="h-4 w-4" />,
							buttonProps: { variant: 'primary', disabled: noPeriodSelected },
						},
					]}
				/>
			</div>

			{creating && (
				<ClassRepresentativeCreateDialog
					saving={assign.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onSave={handleAssign}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingRemove != null}
				onClose={() => setPendingRemove(null)}
				title={t('loads.classRepresentativesMaintenance.remove.title')}
				message={t('loads.classRepresentativesMaintenance.remove.message')}
				confirmLabel={t('loads.classRepresentativesMaintenance.actions.remove')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmRemove}
				onDecline={() => setPendingRemove(null)}
				isLoading={remove.isPending}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
