'use client';

import { useEffect, useMemo, useState } from 'react';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { Button, Card, ConfirmDialog, DataTable, Select, SubTitle, Title, Toast } from '@/shared';
import { useABET, useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { tryTranslate } from '@/shared/utils';
import { DEFAULT_PAGE_SIZE } from '@/shared/constants';
import {
	useProgramsByModality,
	useStudentSectionEnrollmentMaintenanceMutations,
	useStudentSectionEnrollmentsMaintenance,
} from '../hooks';
import type {
	ProgramResponse,
	StudentSectionEnrollmentMaintenanceCreate,
	StudentSectionEnrollmentMaintenanceItem,
	StudentSectionEnrollmentMaintenanceUpdate,
} from '../types';
import {
	StudentSectionEnrollmentCreateDialog,
	StudentSectionEnrollmentEditDialog,
} from '@/modules';
import { StudentSectionEnrollmentBlockedDialog } from './StudentSectionEnrollmentBlockedDialog';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

function localized(text: { es?: string; en?: string } | undefined, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

export function StudentSectionEnrollmentsMaintenance() {
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
	const [editing, setEditing] = useState<StudentSectionEnrollmentMaintenanceItem | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] =
		useState<StudentSectionEnrollmentMaintenanceItem | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { create, update, remove } = useStudentSectionEnrollmentMaintenanceMutations();

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const handleProgramChange = (value: number | null) => {
		setProgramId(value);
		setPage(1);
	};

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging to the first page when the external academic period changes
		setPage(1);
	}, [academicPeriodId]);

	const { data, isLoading, isFetching, isError } = useStudentSectionEnrollmentsMaintenance({
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

	const handleCreate = async (body: StudentSectionEnrollmentMaintenanceCreate) => {
		setCreateError(null);
		try {
			await create.mutateAsync(body);
			showToast('loads.studentSectionEnrollmentsMaintenance.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(
					t,
					reason ??
						getErrorMessage(error, 'loads.studentSectionEnrollmentsMaintenance.create.error'),
				),
			);
		}
	};

	const handleSaveEdit = async (body: StudentSectionEnrollmentMaintenanceUpdate) => {
		if (!editing) return;
		setEditError(null);
		try {
			await update.mutateAsync({ id: editing.id, body });
			showToast('loads.studentSectionEnrollmentsMaintenance.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(
					t,
					reason ?? getErrorMessage(error, 'loads.studentSectionEnrollmentsMaintenance.edit.error'),
				),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('loads.studentSectionEnrollmentsMaintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(
					getErrorMessage(error, 'loads.studentSectionEnrollmentsMaintenance.delete.error'),
					'error',
				);
			}
		}
	};

	const openEdit = (item: StudentSectionEnrollmentMaintenanceItem) => {
		setEditError(null);
		setEditing(item);
	};

	const noPeriodSelected = academicPeriodId == null;

	const columns = useMemo<ColumnDef<StudentSectionEnrollmentMaintenanceItem>[]>(
		() => [
			{
				id: 'courseName',
				header: t('loads.studentSectionEnrollmentsMaintenance.col.courseName'),
				meta: { cellClassName: 'text-zinc-800' },
				cell: ({ row }) => localized(row.original.courseName, locale),
			},
			{
				accessorKey: 'courseCode',
				header: t('loads.studentSectionEnrollmentsMaintenance.col.courseCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				accessorKey: 'sectionCode',
				header: t('loads.studentSectionEnrollmentsMaintenance.col.sectionCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				accessorKey: 'studentCode',
				header: t('loads.studentSectionEnrollmentsMaintenance.col.studentCode'),
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				id: 'studentName',
				header: t('loads.studentSectionEnrollmentsMaintenance.col.studentName'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => `${row.original.studentFirstName} ${row.original.studentLastName}`,
			},
			{
				id: 'actions',
				header: t('loads.studentSectionEnrollmentsMaintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => openEdit(row.original)}
							aria-label={t('loads.studentSectionEnrollmentsMaintenance.actions.edit')}
							title={t('loads.studentSectionEnrollmentsMaintenance.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('loads.studentSectionEnrollmentsMaintenance.actions.delete')}
							title={t('loads.studentSectionEnrollmentsMaintenance.actions.delete')}>
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
						title={t('loads.studentSectionEnrollmentsMaintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.studentSectionEnrollmentsMaintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<DataTable
					columns={columns}
					data={items}
					searchPlaceholder={t('loads.studentSectionEnrollmentsMaintenance.searchPlaceholder')}
					searchValue={search}
					onSearchChange={handleSearchChange}
					filters={
						<div className="w-full sm:w-56">
							<Select
								name="program"
								aria-label={t('loads.studentSectionEnrollmentsMaintenance.programLabel')}
								placeholder={t('loads.studentSectionEnrollmentsMaintenance.programPlaceholder')}
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
					aria-label={t('loads.studentSectionEnrollmentsMaintenance.title')}
					isLoading={isLoading}
					errorMessage={
						isError ? t('loads.studentSectionEnrollmentsMaintenance.error.loadFailed') : undefined
					}
					emptyMessage={
						noPeriodSelected
							? t('loads.studentSectionEnrollmentsMaintenance.selectPeriod')
							: t('loads.studentSectionEnrollmentsMaintenance.empty.title')
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
							label: t('loads.studentSectionEnrollmentsMaintenance.actions.new'),
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
				<StudentSectionEnrollmentCreateDialog
					saving={create.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<StudentSectionEnrollmentEditDialog
					item={editing}
					saving={update.isPending}
					errorMessage={editError}
					onClose={() => setEditing(null)}
					onSave={handleSaveEdit}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('loads.studentSectionEnrollmentsMaintenance.delete.title')}
				message={t('loads.studentSectionEnrollmentsMaintenance.delete.message')}
				confirmLabel={t('loads.studentSectionEnrollmentsMaintenance.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<StudentSectionEnrollmentBlockedDialog
				reasons={blockedReasons}
				onOpenChange={(open) => {
					if (!open) setBlockedReasons(null);
				}}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
