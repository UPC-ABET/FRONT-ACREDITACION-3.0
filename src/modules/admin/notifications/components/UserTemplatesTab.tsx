'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Badge,
	Button,
	ConfirmDialog,
	DataTable,
	TableErrorState,
	Toast,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { TYPE_CODES } from '@/shared/constants';
import { useApiErrorToast } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/apiError';
import {
	useEmailTemplateMutations,
	useEmailTemplates,
	useNotificationCategories,
	useUserNotifyVars,
} from '../hooks/useEmailTemplates';
import type { CoreType, EmailTemplate } from '../types';
import { EmailTemplateEditor } from './EmailTemplateEditor';
import { localizedTypeName } from './localizedTypeName';

type View = { mode: 'list' } | { mode: 'new' } | { mode: 'edit'; template: EmailTemplate };

export function UserTemplatesTab() {
	const { t, locale } = useI18n();
	const { toast, showToast, clearToast } = useApiErrorToast();
	const { data: templates = [], isLoading, isError, refetch } = useEmailTemplates();
	const { data: categories = [] } = useNotificationCategories();
	const { data: userVars = [] } = useUserNotifyVars();
	const { remove } = useEmailTemplateMutations();

	const [view, setView] = useState<View>({ mode: 'list' });
	const [pendingDelete, setPendingDelete] = useState<EmailTemplate | null>(null);

	const userCategoryId = useMemo(
		() =>
			(categories as CoreType[]).find(
				(category) => category.code === TYPE_CODES.NOTIFICATION_CATEGORY.USER,
			)?.id ?? null,
		[categories],
	);

	const userTemplates = useMemo(
		() => templates.filter((template) => template.categoryTypeId === userCategoryId),
		[templates, userCategoryId],
	);

	const handleDelete = async () => {
		if (!pendingDelete) return;
		try {
			await remove.mutateAsync(pendingDelete.id);
			showToast('admin.notify.toast.deleted', 'success');
		} catch (error) {
			showToast(getErrorMessage(error, 'admin.notify.error.deleteFailed'), 'error');
		} finally {
			setPendingDelete(null);
		}
	};

	const columns = useMemo<ColumnDef<EmailTemplate>[]>(
		() => [
			{
				accessorKey: 'code',
				header: t('admin.notify.template.col.code'),
				cell: ({ row }) => <span className="font-mono text-zinc-800">{row.original.code}</span>,
			},
			{
				id: 'name',
				header: t('admin.notify.template.col.name'),
				cell: ({ row }) => localizedTypeName(row.original.name, locale, '—'),
			},
			{
				id: 'status',
				header: t('admin.notify.template.col.status'),
				cell: ({ row }) => (
					<Badge variant={row.original.isActive ? 'success' : 'default'}>
						{t(
							row.original.isActive
								? 'admin.notify.badge.active'
								: 'admin.notify.badge.inactive',
						)}
					</Badge>
				),
			},
			{
				id: 'actions',
				header: t('admin.notify.template.col.actions'),
				cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setView({ mode: 'edit', template: row.original })}
							aria-label={t('admin.notify.btn.edit')}>
							<PencilSquareIcon className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('admin.notify.btn.delete')}>
							<TrashIcon className="h-4 w-4" />
						</Button>
					</div>
				),
			},
		],
		[t, locale],
	);

	if (view.mode !== 'list') {
		return (
			<div className="space-y-4">
				<EmailTemplateEditor
					key={view.mode === 'edit' ? view.template.id : 'new'}
					template={view.mode === 'edit' ? view.template : null}
					lockedCategoryId={userCategoryId}
					notifyVars={userVars}
					onCancel={() => setView({ mode: 'list' })}
					onSuccess={(messageKey) => {
						showToast(messageKey, 'success');
						setView({ mode: 'list' });
					}}
					onError={(message) => showToast(message, 'error')}
				/>
				<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
			</div>
		);
	}

	if (isError) {
		return (
			<TableErrorState
				message={t('admin.notify.error.listFailed')}
				onRetry={() => refetch()}
				retryLabel={t('admin.notify.btn.retry')}
			/>
		);
	}

	return (
		<div className="space-y-4">
			<DataTable
				columns={columns}
				data={userTemplates}
				title={t('admin.notify.user.title')}
				searchPlaceholder={t('admin.notify.template.search')}
				aria-label={t('admin.notify.user.title')}
				actions={[
					{
						label: t('admin.notify.user.create'),
						onClick: () => setView({ mode: 'new' }),
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>
			{isLoading && <p className="text-sm text-zinc-500">{t('loading.default')}</p>}

			<ConfirmDialog
				isOpen={pendingDelete != null}
				onClose={() => setPendingDelete(null)}
				title={t('admin.notify.confirm.deleteTitle')}
				message={t('admin.notify.confirm.delete')}
				confirmLabel={t('admin.notify.btn.delete')}
				declineLabel={t('dialog.actions.cancel')}
				onConfirm={handleDelete}
				onDecline={() => setPendingDelete(null)}
				isLoading={remove.isPending}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
