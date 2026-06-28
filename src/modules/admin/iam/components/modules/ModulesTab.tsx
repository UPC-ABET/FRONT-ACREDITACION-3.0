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
import { useModules, useModuleTypeMutations } from '../../hooks';
import type { IamType } from '../../types';
import { localizedText } from '../localizedText';
import { ModuleTypeFormDialog } from './ModuleTypeFormDialog';

export function ModulesTab() {
	const { t, locale } = useI18n();
	const { toast, showToast, clearToast } = useApiErrorToast();
	const { data: modules = [], isLoading, isError, refetch } = useModules();
	const { data: typeGroups } = useTypeGroups({ code: TYPE_GROUP_CODES.IAM_MODULE });
	const { remove } = useModuleTypeMutations();

	const typeGroupId = typeGroups?.[0]?.id ?? null;

	const [editing, setEditing] = useState<IamType | null>(null);
	const [isFormOpen, setFormOpen] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<IamType | null>(null);

	const openCreate = () => {
		setEditing(null);
		setFormOpen(true);
	};

	const openEdit = (module: IamType) => {
		setEditing(module);
		setFormOpen(true);
	};

	const handleDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('admin.iam.modules.toast.deleted', 'success');
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
				header: t('admin.iam.modules.col.code'),
				cell: ({ row }) => <span className="font-mono text-zinc-800">{row.original.code}</span>,
			},
			{
				id: 'name',
				header: t('admin.iam.modules.col.name'),
				accessorFn: (row) => localizedText(row.name, locale),
				cell: ({ row }) => localizedText(row.original.name, locale),
			},
			{
				id: 'route',
				header: t('admin.iam.modules.col.route'),
				cell: ({ row }) => (
					<span className="font-mono text-xs text-zinc-500">
						{row.original.extra?.route ?? '—'}
					</span>
				),
			},
			{
				id: 'module',
				header: t('admin.iam.modules.col.module'),
				cell: ({ row }) => (
					<span className="font-mono text-xs text-zinc-500">
						{row.original.extra?.module ?? '—'}
					</span>
				),
			},
			{
				id: 'actions',
				header: t('admin.iam.modules.col.actions'),
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => openEdit(row.original)}
							title={t('admin.iam.actions.edit')}
							aria-label={t('admin.iam.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							title={t('admin.iam.actions.delete')}
							aria-label={t('admin.iam.actions.delete')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
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
				data={modules}
				title={t('admin.iam.modules.title')}
				searchPlaceholder={t('admin.iam.modules.search')}
				aria-label={t('admin.iam.modules.title')}
				isLoading={isLoading}
				actions={[
					{
						label: t('admin.iam.modules.create'),
						onClick: openCreate,
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>

			{isFormOpen && (
				<ModuleTypeFormDialog
					open
					module={editing}
					typeGroupId={typeGroupId}
					onClose={() => setFormOpen(false)}
					onSuccess={(messageKey) => showToast(messageKey, 'success')}
					onError={(message) => showToast(message, 'error')}
				/>
			)}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('admin.iam.modules.confirmDelete.title')}
				message={t('admin.iam.modules.confirmDelete.message')}
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
