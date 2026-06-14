'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Badge,
	Button,
	ConfirmDialog,
	DataTable,
	LoadingState,
	TableErrorState,
	Toast,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/apiError';
import { useDeleteRole, useIamView, useRoles } from '../../hooks';
import type { AdminRole } from '../../types';
import { localizedText } from '../localizedText';
import { RoleFormView } from './RoleFormView';

export function RolesTab() {
	const { t, locale } = useI18n();
	const { mode, editId, openCreate, openEdit, backToList } = useIamView('roles');
	const { toast, showToast, clearToast } = useApiErrorToast();
	const { data: roles = [], isLoading, isError, refetch } = useRoles();
	const deleteRole = useDeleteRole();

	const [pendingDelete, setPendingDelete] = useState<AdminRole | null>(null);

	const handleDelete = async () => {
		if (!pendingDelete) return;
		try {
			await deleteRole.mutateAsync(pendingDelete.id);
			showToast('admin.iam.roles.toast.deleted', 'success');
		} catch (error) {
			showToast(getErrorMessage(error, 'admin.iam.roles.error.deleteFailed'), 'error');
		} finally {
			setPendingDelete(null);
		}
	};

	const columns = useMemo<ColumnDef<AdminRole>[]>(
		() => [
			{
				accessorKey: 'code',
				header: t('admin.iam.roles.col.code'),
				cell: ({ row }) => <span className="font-mono text-zinc-800">{row.original.code}</span>,
			},
			{
				id: 'name',
				header: t('admin.iam.roles.col.name'),
				accessorFn: (row) => localizedText(row.name, locale),
				cell: ({ row }) => localizedText(row.original.name, locale),
			},
			{
				id: 'status',
				header: t('admin.iam.roles.col.status'),
				cell: ({ row }) => (
					<Badge variant={row.original.isActive ? 'success' : 'default'}>
						{t(
							row.original.isActive
								? 'admin.iam.roles.badge.active'
								: 'admin.iam.roles.badge.inactive',
						)}
					</Badge>
				),
			},
			{
				id: 'actions',
				header: t('admin.iam.roles.col.actions'),
				cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => openEdit(row.original.id)}
							title={t('admin.iam.actions.edit')}
							aria-label={t('admin.iam.actions.edit')}>
							<PencilSquareIcon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							title={t('admin.iam.actions.delete')}
							aria-label={t('admin.iam.actions.delete')}>
							<TrashIcon className="h-4 w-4" />
						</Button>
					</div>
				),
			},
		],
		[t, locale, openEdit],
	);

	if (mode !== 'list') {
		const editingRole = mode === 'edit' ? (roles.find((role) => role.id === editId) ?? null) : null;
		const editLoading = mode === 'edit' && !editingRole && isLoading;
		const editNotFound = mode === 'edit' && !editingRole && !isLoading;

		return (
			<div className="space-y-4">
				{editLoading ? (
					<LoadingState />
				) : editNotFound ? (
					<div className="space-y-3">
						<Button variant="ghost" size="sm" onClick={backToList} className="self-start">
							<ArrowLeftIcon className="h-4 w-4" />
							{t('admin.iam.roles.form.back')}
						</Button>
						<p className="text-sm italic text-zinc-500">{t('admin.iam.roles.notFound')}</p>
					</div>
				) : (
					<RoleFormView
						key={editId ?? 'new'}
						role={editingRole}
						onCancel={backToList}
						onSuccess={(messageKey) => {
							showToast(messageKey, 'success');
							backToList();
						}}
						onError={(message) => showToast(message, 'error')}
					/>
				)}

				<Toast
					isOpen={toast.isOpen}
					onClose={clearToast}
					type={toast.type}
					message={toast.message}
				/>
			</div>
		);
	}

	if (isError) {
		return (
			<TableErrorState
				message={t('admin.iam.roles.error.listFailed')}
				onRetry={() => refetch()}
				retryLabel={t('admin.iam.retry')}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<DataTable
				columns={columns}
				data={roles}
				title={t('admin.iam.roles.title')}
				searchPlaceholder={t('admin.iam.roles.search')}
				aria-label={t('admin.iam.roles.title')}
				isLoading={isLoading}
				actions={[
					{
						label: t('admin.iam.roles.create'),
						onClick: openCreate,
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('admin.iam.roles.confirmDelete.title')}
				message={t('admin.iam.roles.confirmDelete.message')}
				confirmLabel={t('admin.iam.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={deleteRole.isPending}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
