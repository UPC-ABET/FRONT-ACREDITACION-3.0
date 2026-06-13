'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, ConfirmDialog, DataTable, TableErrorState, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/apiError';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useTypeGroups } from '@/modules/core';
import { usePermissions, usePermissionTypeMutations } from '../../hooks';
import type { IamType } from '../../types';
import { localizedText } from '../localizedText';
import { PermissionTypeFormDialog } from './PermissionTypeFormDialog';

export function PermissionsTab() {
	const { t, locale } = useI18n();
	const { toast, showToast, clearToast } = useApiErrorToast();
	const { data: permissions = [], isLoading, isError, refetch } = usePermissions();
	const { data: typeGroups } = useTypeGroups({ code: TYPE_GROUP_CODES.IAM_PERMISSION });
	const { remove } = usePermissionTypeMutations();

	const typeGroupId = typeGroups?.[0]?.id ?? null;

	const [editing, setEditing] = useState<IamType | null>(null);
	const [isFormOpen, setFormOpen] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<IamType | null>(null);

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (permission: IamType) => {
		setEditing(permission);
		setFormOpen(true);
	};

	const handleDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('admin.iam.permissions.toast.deleted', 'success');
		} catch (error) {
			showToast(getErrorMessage(error, 'admin.iam.types.error.deleteFailed'), 'error');
		} finally {
			setPendingDelete(null);
		}
	};

	const columns = useMemo<ColumnDef<IamType>[]>(
		() => [
			{
				accessorKey: 'code',
				header: t('admin.iam.permissions.col.code'),
				cell: ({ row }) => <span className="font-mono text-zinc-800">{row.original.code}</span>,
			},
			{
				id: 'name',
				header: t('admin.iam.permissions.col.name'),
				accessorFn: (row) => localizedText(row.name, locale),
				cell: ({ row }) => localizedText(row.original.name, locale),
			},
			{
				id: 'actions',
				header: t('admin.iam.permissions.col.actions'),
				cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => openEdit(row.original)}
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
		[t, locale],
	);

	if (isError) {
		return (
			<TableErrorState
				message={t('admin.iam.types.error.listFailed')}
				onRetry={() => refetch()}
				retryLabel={t('admin.iam.retry')}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<DataTable
				columns={columns}
				data={permissions}
				title={t('admin.iam.permissions.title')}
				searchPlaceholder={t('admin.iam.permissions.search')}
				aria-label={t('admin.iam.permissions.title')}
				isLoading={isLoading}
				actions={[
					{
						label: t('admin.iam.permissions.create'),
						onClick: openCreate,
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>

			{isFormOpen && (
				<PermissionTypeFormDialog
					open
					permission={editing}
					typeGroupId={typeGroupId}
					onClose={() => setFormOpen(false)}
					onSuccess={(messageKey) => showToast(messageKey, 'success')}
					onError={(message) => showToast(message, 'error')}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('admin.iam.permissions.confirmDelete.title')}
				message={t('admin.iam.permissions.confirmDelete.message')}
				confirmLabel={t('admin.iam.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
