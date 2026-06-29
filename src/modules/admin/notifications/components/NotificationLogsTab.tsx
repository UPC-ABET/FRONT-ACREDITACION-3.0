'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, DataTable, Select, TableErrorState } from '@/shared';
import { useI18n } from '@/providers';
import { TYPE_CODES } from '@/shared/constants';
import { useNotificationCategories } from '../hooks/useEmailTemplates';
import { useNotificationLogs, useNotificationStatuses } from '../hooks/useNotificationLogs';
import type { CoreType, NotificationLog, NotificationLogFilters } from '../types';
import { localizedTypeName } from './localizedTypeName';

function statusVariant(code: string): 'success' | 'danger' | 'default' {
	if (code === TYPE_CODES.NOTIFICATION_STATUS.SENT) return 'success';
	if (code === TYPE_CODES.NOTIFICATION_STATUS.FAILED) return 'danger';
	return 'default';
}

function formatDate(value: string | null): string {
	if (!value) return '—';
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

export function NotificationLogsTab() {
	const { t, locale } = useI18n();
	const { data: categories = [] } = useNotificationCategories();
	const { data: statuses = [] } = useNotificationStatuses();

	const [categoryTypeId, setCategoryTypeId] = useState<number | null>(null);
	const [statusTypeId, setStatusTypeId] = useState<number | null>(null);

	const filters = useMemo<NotificationLogFilters>(
		() => ({
			...(categoryTypeId != null ? { categoryTypeId } : {}),
			...(statusTypeId != null ? { statusTypeId } : {}),
		}),
		[categoryTypeId, statusTypeId],
	);

	const { data: logs = [], isLoading, isError, refetch } = useNotificationLogs(filters);

	const categoryNameById = useMemo(() => {
		const map = new Map<number, string>();
		for (const category of categories as CoreType[]) {
			map.set(category.id, localizedTypeName(category.name, locale, category.code));
		}
		return map;
	}, [categories, locale]);

	const categoryOptions = useMemo(
		() =>
			(categories as CoreType[]).map((category) => ({
				value: category.id,
				label: localizedTypeName(category.name, locale, category.code),
			})),
		[categories, locale],
	);

	const selectedCategory =
		categoryOptions.find((option) => option.value === categoryTypeId) ?? null;

	const statusOptions = useMemo(
		() =>
			(statuses as CoreType[]).map((status) => ({
				value: status.id,
				label: localizedTypeName(status.name, locale, status.code),
			})),
		[statuses, locale],
	);

	const selectedStatus = statusOptions.find((option) => option.value === statusTypeId) ?? null;

	const columns = useMemo<ColumnDef<NotificationLog>[]>(
		() => [
			{
				id: 'createdAt',
				header: t('admin.notify.log.col.date'),
				cell: ({ row }) => (
					<span className="whitespace-nowrap text-zinc-700">
						{formatDate(row.original.createdAt)}
					</span>
				),
			},
			{
				id: 'category',
				header: t('admin.notify.log.col.category'),
				cell: ({ row }) => categoryNameById.get(row.original.categoryTypeId) ?? '—',
			},
			{
				id: 'to',
				header: t('admin.notify.log.col.to'),
				cell: ({ row }) => (
					<span className="text-zinc-700">{row.original.toEmails.join(', ') || '—'}</span>
				),
			},
			{
				id: 'status',
				header: t('admin.notify.log.col.status'),
				cell: ({ row }) => {
					const statusType = row.original.statusType;
					return (
						<Badge variant={statusVariant(statusType.code)}>
							{localizedTypeName(statusType.name, locale, statusType.code)}
						</Badge>
					);
				},
			},
			{
				id: 'error',
				header: t('admin.notify.log.col.error'),
				cell: ({ row }) => <span className="text-red-700">{row.original.errorMessage ?? '—'}</span>,
			},
		],
		[t, locale, categoryNameById],
	);

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
			<Card>
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[280px_280px]">
					<Select
						name="category"
						label={t('admin.notify.log.filter.category')}
						placeholder={t('admin.notify.log.filter.categoryPlaceholder')}
						isClearable
						options={categoryOptions}
						value={selectedCategory}
						onChange={(_name, value) =>
							setCategoryTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>
					<Select
						name="status"
						label={t('admin.notify.log.filter.status')}
						placeholder={t('admin.notify.log.filter.statusPlaceholder')}
						isClearable
						options={statusOptions}
						value={selectedStatus}
						onChange={(_name, value) =>
							setStatusTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>
				</div>
			</Card>

			<DataTable
				columns={columns}
				data={logs}
				title={t('admin.notify.log.title')}
				description={t('admin.notify.log.subtitle')}
				isLoading={isLoading}
				aria-label={t('admin.notify.log.title')}
			/>
		</div>
	);
}
