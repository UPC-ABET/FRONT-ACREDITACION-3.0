'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PencilSquareIcon, PlusIcon, XCircleIcon } from '@heroicons/react/24/outline';
import {
	Badge,
	Button,
	DataTable,
	DeleteConfirmDialog,
	PageHeader,
	Toast,
} from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n, useGlobalAcademicFiltersVisibilityOverride } from '@/providers';
import { formatDate, interpolate, tryTranslate } from '@/shared/utils';
import { useApiTokens, useRevokeApiToken } from '../hooks/useApiTokens';
import { ApiTokenCreateDialog } from '../components/ApiTokenCreateDialog';
import { ApiTokenEditDialog } from '../components/ApiTokenEditDialog';
import type { ApiToken } from '../types';

export default function AdminApiTokensPage() {
	const { t } = useI18n();
	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: false, period: false });

	const { data: tokens = [], isLoading, isError } = useApiTokens();
	const revokeApiToken = useRevokeApiToken();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [search, setSearch] = useState('');
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editingToken, setEditingToken] = useState<ApiToken | null>(null);
	const [pendingRevoke, setPendingRevoke] = useState<ApiToken | null>(null);

	const filteredTokens = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return tokens;
		return tokens.filter(
			(token) =>
				token.name.toLowerCase().includes(query) || token.keyId.toLowerCase().includes(query),
		);
	}, [tokens, search]);

	function handleRevoke() {
		if (!pendingRevoke) return;
		revokeApiToken.mutate(pendingRevoke.id, {
			onSuccess: () => {
				showToast(t('admin.apiTokens.toast.revoked'), 'success');
				setPendingRevoke(null);
			},
			onError: (err) => {
				showToast(
					err instanceof Error
						? tryTranslate(t, err.message)
						: t('admin.apiTokens.error.revokeFailed'),
					'error',
				);
				setPendingRevoke(null);
			},
		});
	}

	const columns = useMemo<ColumnDef<ApiToken>[]>(
		() => [
			{
				accessorKey: 'name',
				header: t('admin.apiTokens.table.col.name'),
				cell: ({ row }) => <span className="font-semibold text-zinc-800">{row.original.name}</span>,
			},
			{
				accessorKey: 'keyId',
				header: t('admin.apiTokens.table.col.keyId'),
				cell: ({ row }) => <span className="font-mono text-zinc-700">{row.original.keyId}</span>,
			},
			{
				id: 'scopes',
				header: t('admin.apiTokens.table.col.scopes'),
				cell: ({ row }) => (
					<div className="flex flex-wrap gap-1">
						{row.original.scopes.map((scope) => (
							<Badge key={`${scope.module}:${scope.action}`} variant="outline">
								{scope.module}:{scope.action}
							</Badge>
						))}
					</div>
				),
			},
			{
				id: 'status',
				header: t('admin.apiTokens.table.col.status'),
				cell: ({ row }) => (
					<Badge variant={row.original.isActive ? 'success' : 'default'}>
						{t(
							row.original.isActive
								? 'admin.apiTokens.badge.active'
								: 'admin.apiTokens.badge.revoked',
						)}
					</Badge>
				),
			},
			{
				id: 'expiresAt',
				header: t('admin.apiTokens.table.col.expiresAt'),
				cell: ({ row }) =>
					row.original.expiresAt ? (
						formatDate(row.original.expiresAt)
					) : (
						<span className="text-zinc-400">{t('admin.apiTokens.noExpiration')}</span>
					),
			},
			{
				id: 'createdAt',
				header: t('admin.apiTokens.table.col.createdAt'),
				cell: ({ row }) => formatDate(row.original.createdAt),
			},
			{
				id: 'actions',
				header: t('admin.apiTokens.table.col.actions'),
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
							onClick={() => setEditingToken(row.original)}
							title={t('admin.apiTokens.actions.edit')}
							aria-label={t('admin.apiTokens.actions.edit')}>
							<PencilSquareIcon className="h-5 w-5" />
						</Button>
						{row.original.isActive && (
							<Button
								variant="ghost"
								size="icon"
								className="text-red-600 hover:bg-red-50"
								onClick={() => setPendingRevoke(row.original)}
								title={t('admin.apiTokens.actions.revoke')}
								aria-label={t('admin.apiTokens.actions.revoke')}>
								<XCircleIcon className="h-5 w-5" />
							</Button>
						)}
					</div>
				),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
			},
		],
		[t],
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('admin.apiTokens.page.title')}
				description={t('admin.apiTokens.page.subtitle')}
			/>

			<DataTable
				columns={columns}
				data={filteredTokens}
				searchPlaceholder={t('admin.apiTokens.table.search')}
				searchValue={search}
				onSearchChange={setSearch}
				aria-label={t('admin.apiTokens.page.title')}
				isLoading={isLoading}
				errorMessage={isError ? t('admin.apiTokens.error.listFailed') : undefined}
				actions={[
					{
						label: t('admin.apiTokens.table.create'),
						onClick: () => setCreateDialogOpen(true),
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>

			<ApiTokenCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

			<ApiTokenEditDialog
				token={editingToken}
				onOpenChange={(open) => !open && setEditingToken(null)}
			/>

			<DeleteConfirmDialog
				open={pendingRevoke != null}
				onOpenChange={(open) => !open && setPendingRevoke(null)}
				title={t('admin.apiTokens.confirmRevoke.title')}
				description={interpolate(t('admin.apiTokens.confirmRevoke.description'), {
					name: pendingRevoke?.name ?? '',
				})}
				isPending={revokeApiToken.isPending}
				cancelLabel={t('dialog.actions.cancel')}
				confirmLabel={t('admin.apiTokens.actions.revoke')}
				onConfirm={handleRevoke}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
