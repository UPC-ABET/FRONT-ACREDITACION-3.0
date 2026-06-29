'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
	ExclamationTriangleIcon,
	PencilSquareIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	DataTable,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	SubTitle,
	Title,
	Toast,
	DEFAULT_PAGE_SIZE,
	tryTranslate,
	useApiErrorToast,
} from '@/shared';
import { useI18n } from '@/providers';
import { getApiErrorReasons, getErrorMessage } from '@/shared/lib';
import { useProfessorMaintenanceMutations, useProfessorsMaintenance } from '../hooks';
import type {
	ProfessorMaintenanceCreate,
	ProfessorMaintenanceItem,
	ProfessorMaintenanceUpdate,
} from '../types';
import { ProfessorMaintenanceCreateDialog, ProfessorMaintenanceEditDialog } from '@/modules';

const PAGE_SIZE = DEFAULT_PAGE_SIZE;

export function ProfessorsMaintenance() {
	const { t } = useI18n();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [creating, setCreating] = useState(false);
	const [createError, setCreateError] = useState<string | null>(null);
	const [editing, setEditing] = useState<ProfessorMaintenanceItem | null>(null);
	const [editError, setEditError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<ProfessorMaintenanceItem | null>(null);
	const [blockedReasons, setBlockedReasons] = useState<string[] | null>(null);

	const { create, update, remove } = useProfessorMaintenanceMutations();

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	const handleSearchChange = (value: string) => {
		setSearch(value);
		setPage(1);
	};

	const { data, isLoading, isFetching, isError } = useProfessorsMaintenance({
		page,
		pageSize: PAGE_SIZE,
		search: debouncedSearch,
	});

	const items = data?.items ?? [];
	const total = data?.total ?? 0;
	const totalPages = data?.totalPages ?? 1;

	const handleCreate = async (body: ProfessorMaintenanceCreate) => {
		setCreateError(null);
		try {
			await create.mutateAsync(body);
			showToast('loads.maintenance.toast.created', 'success');
			setCreating(false);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setCreateError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.maintenance.create.error')),
			);
		}
	};

	const handleSaveEdit = async (body: ProfessorMaintenanceUpdate) => {
		if (!editing) return;
		setEditError(null);
		try {
			await update.mutateAsync({ id: editing.id, body });
			showToast('loads.maintenance.toast.updated', 'success');
			setEditing(null);
		} catch (error) {
			const [reason] = getApiErrorReasons(error);
			setEditError(
				tryTranslate(t, reason ?? getErrorMessage(error, 'loads.maintenance.edit.error')),
			);
		}
	};

	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('loads.maintenance.toast.deleted', 'success');
			setPendingDelete(null);
		} catch (error) {
			const reasons = getApiErrorReasons(error);
			setPendingDelete(null);
			if (reasons.length > 0) {
				setBlockedReasons(reasons);
			} else {
				showToast(getErrorMessage(error, 'loads.maintenance.delete.error'), 'error');
			}
		}
	};

	const openEdit = (item: ProfessorMaintenanceItem) => {
		setEditError(null);
		setEditing(item);
	};

	const columns = useMemo<ColumnDef<ProfessorMaintenanceItem>[]>(
		() => [
			{
				accessorKey: 'code',
				header: t('loads.maintenance.col.code'),
				meta: { cellClassName: 'font-mono text-zinc-800' },
			},
			{
				accessorKey: 'firstName',
				header: t('loads.maintenance.col.firstName'),
				meta: { cellClassName: 'text-zinc-700' },
			},
			{
				accessorKey: 'lastName',
				header: t('loads.maintenance.col.lastName'),
				meta: { cellClassName: 'text-zinc-700' },
			},
			{
				id: 'email',
				header: t('loads.maintenance.col.email'),
				meta: { cellClassName: 'text-zinc-700' },
				cell: ({ row }) => row.original.staffEmail ?? <span className="text-zinc-400">—</span>,
			},
			{
				id: 'actions',
				header: t('loads.maintenance.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => openEdit(row.original)}
							aria-label={t('loads.maintenance.actions.edit')}
							title={t('loads.maintenance.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('loads.maintenance.actions.delete')}
							title={t('loads.maintenance.actions.delete')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
			},
		],
		[t],
	);

	return (
		<Card>
			<div className="space-y-5">
				<div className="space-y-1">
					<Title
						title={t('loads.maintenance.title')}
						className="[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900"
					/>
					<SubTitle
						name={t('loads.maintenance.subtitle')}
						className="[&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-gray-500"
					/>
				</div>

				<DataTable
					columns={columns}
					data={items}
					searchPlaceholder={t('loads.maintenance.searchPlaceholder')}
					searchValue={search}
					onSearchChange={handleSearchChange}
					aria-label={t('loads.maintenance.title')}
					isLoading={isLoading}
					errorMessage={isError ? t('loads.maintenance.error.loadFailed') : undefined}
					emptyMessage={t('loads.maintenance.empty.title')}
					serverPagination={{
						page,
						pageCount: totalPages,
						total,
						onPageChange: setPage,
						isFetching,
					}}
					actions={[
						{
							label: t('loads.maintenance.actions.new'),
							onClick: () => {
								setCreateError(null);
								setCreating(true);
							},
							icon: <PlusIcon className="h-4 w-4" />,
							buttonProps: { variant: 'primary' },
						},
					]}
				/>
			</div>

			{creating && (
				<ProfessorMaintenanceCreateDialog
					saving={create.isPending}
					errorMessage={createError}
					onClose={() => setCreating(false)}
					onCreate={handleCreate}
				/>
			)}

			{editing && (
				<ProfessorMaintenanceEditDialog
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
				title={t('loads.maintenance.delete.title')}
				message={t('loads.maintenance.delete.message')}
				confirmLabel={t('loads.maintenance.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleConfirmDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<Dialog
				open={blockedReasons != null}
				onOpenChange={(open) => {
					if (!open) setBlockedReasons(null);
				}}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<div className="flex items-center gap-2 text-red-700">
							<ExclamationTriangleIcon className="h-5 w-5" />
							<DialogTitle>{t('loads.maintenance.delete.blockedTitle')}</DialogTitle>
						</div>
						<DialogDescription>{t('loads.maintenance.delete.blockedSubtitle')}</DialogDescription>
					</DialogHeader>
					<ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
						{(blockedReasons ?? []).map((reason) => (
							<li key={reason}>{tryTranslate(t, reason)}</li>
						))}
					</ul>
					<DialogFooter showCloseButton />
				</DialogContent>
			</Dialog>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
