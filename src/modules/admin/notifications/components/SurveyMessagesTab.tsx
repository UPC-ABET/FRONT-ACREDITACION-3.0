'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, ConfirmDialog, DataTable, TableErrorState, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/apiError';
import {
	useSurveyMessageMutations,
	useSurveyMessages,
	useSurveyTypes,
} from '../hooks/useSurveyMessages';
import type { CoreType, SurveyMessage } from '../types';
import { SurveyMessageEditor } from './SurveyMessageEditor';
import { StatusBadge, TabHeader } from './shared';
import { localizedTypeName } from './localizedTypeName';

type View = { mode: 'list' } | { mode: 'new' } | { mode: 'edit'; message: SurveyMessage };

export function SurveyMessagesTab() {
	const { t, locale } = useI18n();
	const { toast, showToast, clearToast } = useApiErrorToast();
	const { data: messages = [], isLoading, isError, refetch } = useSurveyMessages();
	const { data: surveyTypes = [] } = useSurveyTypes();
	const { remove } = useSurveyMessageMutations();

	const [view, setView] = useState<View>({ mode: 'list' });
	const [pendingDelete, setPendingDelete] = useState<SurveyMessage | null>(null);

	const surveyTypeNameById = useMemo(() => {
		const map = new Map<number, string>();
		for (const type of surveyTypes as CoreType[]) {
			map.set(type.id, localizedTypeName(type.name, locale, type.code));
		}
		return map;
	}, [surveyTypes, locale]);

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

	const columns = useMemo<ColumnDef<SurveyMessage>[]>(
		() => [
			{
				id: 'surveyType',
				header: t('admin.notify.survey.col.surveyType'),
				cell: ({ row }) => surveyTypeNameById.get(row.original.surveyTypeId) ?? '—',
			},
			{
				id: 'name',
				header: t('admin.notify.survey.col.name'),
				cell: ({ row }) => localizedTypeName(row.original.name, locale, '—'),
			},
			{
				id: 'status',
				header: t('admin.notify.survey.col.status'),
				cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
			},
			{
				id: 'actions',
				header: t('admin.notify.survey.col.actions'),
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => setView({ mode: 'edit', message: row.original })}
							aria-label={t('admin.notify.btn.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-red-600 hover:bg-red-50"
							onClick={() => setPendingDelete(row.original)}
							aria-label={t('admin.notify.btn.delete')}>
							<TrashIcon className="h-5 w-5" />
						</Button>
					</div>
				),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
			},
		],
		[t, locale, surveyTypeNameById],
	);

	if (view.mode !== 'list') {
		return (
			<div className="space-y-4">
				<SurveyMessageEditor
					key={view.mode === 'edit' ? view.message.id : 'new'}
					message={view.mode === 'edit' ? view.message : null}
					onCancel={() => setView({ mode: 'list' })}
					onSuccess={(messageKey) => {
						showToast(messageKey, 'success');
						setView({ mode: 'list' });
					}}
					onError={(message) => showToast(message, 'error')}
				/>
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
				message={t('admin.notify.error.listFailed')}
				onRetry={() => refetch()}
				retryLabel={t('admin.notify.btn.retry')}
			/>
		);
	}

	return (
		<div className="space-y-6">
			<TabHeader
				title={t('admin.notify.survey.title')}
				description={t('admin.notify.survey.subtitle')}
			/>
			<DataTable
				columns={columns}
				data={messages}
				aria-label={t('admin.notify.survey.title')}
				isLoading={isLoading}
				actions={[
					{
						label: t('admin.notify.survey.create'),
						onClick: () => setView({ mode: 'new' }),
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>

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
