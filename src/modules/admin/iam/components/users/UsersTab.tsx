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
import { useDeleteUser, useDocumentTypes, useIamView, useUsers } from '../../hooks';
import type { IamUser } from '../../types';
import { localizedText } from '../localizedText';
import { UserFormView } from './UserFormView';

export function UsersTab() {
	const { t, locale } = useI18n();
	const { mode, editId, openCreate, openEdit, backToList } = useIamView('users');
	const { toast, showToast, clearToast } = useApiErrorToast();
	const { data: users = [], isLoading, isError, refetch } = useUsers();
	const { data: documentTypes = [] } = useDocumentTypes();
	const deleteUser = useDeleteUser();

	const [pendingDelete, setPendingDelete] = useState<IamUser | null>(null);

	const documentTypeNameById = useMemo(() => {
		const map = new Map<number, string>();
		for (const type of documentTypes) {
			map.set(type.id, localizedText(type.name, locale, type.code));
		}
		return map;
	}, [documentTypes, locale]);

	const handleDelete = async () => {
		if (!pendingDelete) return;
		try {
			await deleteUser.mutateAsync(pendingDelete.id);
			showToast('admin.iam.users.toast.deleted', 'success');
		} catch (error) {
			showToast(getErrorMessage(error, 'admin.iam.users.error.deleteFailed'), 'error');
		} finally {
			setPendingDelete(null);
		}
	};

	const columns = useMemo<ColumnDef<IamUser>[]>(
		() => [
			{
				id: 'name',
				header: t('admin.iam.users.col.name'),
				accessorFn: (row) => `${row.firstName} ${row.lastName}`,
				cell: ({ row }) => (
					<span className="font-semibold text-zinc-800">
						{row.original.firstName} {row.original.lastName}
					</span>
				),
			},
			{
				accessorKey: 'email',
				header: t('admin.iam.users.col.email'),
			},
			{
				id: 'document',
				header: t('admin.iam.users.col.document'),
				cell: ({ row }) => {
					const typeName =
						row.original.documentTypeId != null
							? documentTypeNameById.get(row.original.documentTypeId)
							: undefined;
					if (!row.original.documentCode && !typeName)
						return <span className="text-zinc-400">—</span>;
					return (
						<span className="flex flex-col">
							{typeName && <span className="text-xs text-zinc-400">{typeName}</span>}
							<span className="font-mono text-zinc-700">{row.original.documentCode ?? '—'}</span>
						</span>
					);
				},
			},
			{
				id: 'teacher',
				header: t('admin.iam.users.col.teacher'),
				cell: ({ row }) => {
					const teacher = row.original.linkedTeacher;
					if (!teacher) return <span className="text-zinc-400">—</span>;
					const fullName = `${teacher.firstName} ${teacher.lastName}`.trim();
					return (
						<span className="flex flex-col">
							{teacher.code && (
								<span className="font-mono text-xs text-zinc-400">{teacher.code}</span>
							)}
							<span className="text-zinc-700">{fullName || '—'}</span>
						</span>
					);
				},
			},
			{
				id: 'status',
				header: t('admin.iam.users.col.status'),
				cell: ({ row }) => (
					<Badge variant={row.original.isActive ? 'success' : 'default'}>
						{t(
							row.original.isActive
								? 'admin.iam.users.badge.active'
								: 'admin.iam.users.badge.inactive',
						)}
					</Badge>
				),
			},
			{
				id: 'actions',
				header: t('admin.iam.users.col.actions'),
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
		[t, openEdit, documentTypeNameById],
	);

	if (mode !== 'list') {
		const editingUser = mode === 'edit' ? (users.find((user) => user.id === editId) ?? null) : null;
		const editLoading = mode === 'edit' && !editingUser && isLoading;
		const editNotFound = mode === 'edit' && !editingUser && !isLoading;

		return (
			<div className="space-y-4">
				{editLoading ? (
					<LoadingState />
				) : editNotFound ? (
					<div className="space-y-3">
						<Button variant="ghost" size="sm" onClick={backToList} className="self-start">
							<ArrowLeftIcon className="h-4 w-4" />
							{t('admin.iam.users.form.back')}
						</Button>
						<p className="text-sm italic text-zinc-500">{t('admin.iam.users.notFound')}</p>
					</div>
				) : (
					<UserFormView
						key={editId ?? 'new'}
						user={editingUser}
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
				message={t('admin.iam.users.error.listFailed')}
				onRetry={() => refetch()}
				retryLabel={t('admin.iam.retry')}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<DataTable
				columns={columns}
				data={users}
				title={t('admin.iam.users.title')}
				searchPlaceholder={t('admin.iam.users.search')}
				aria-label={t('admin.iam.users.title')}
				isLoading={isLoading}
				actions={[
					{
						label: t('admin.iam.users.create'),
						onClick: openCreate,
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('admin.iam.users.confirmDelete.title')}
				message={t('admin.iam.users.confirmDelete.message')}
				confirmLabel={t('admin.iam.actions.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={deleteUser.isPending}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
