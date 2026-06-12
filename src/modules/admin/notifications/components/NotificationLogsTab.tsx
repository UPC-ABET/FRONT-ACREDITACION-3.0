'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable, Input, Select, TableErrorState } from '@/shared/components';
import { useI18n } from '@/providers';
import { useNotificationCategories } from '../hooks/useEmailTemplates';
import { useNotificationLogs } from '../hooks/useNotificationLogs';
import type { CoreType, NotificationLog, NotificationLogFilters } from '../types';
import { localizedTypeName } from './localizedTypeName';

function statusVariant(status: string): 'success' | 'danger' | 'default' {
	const value = status?.toLowerCase() ?? '';
	if (value.includes('sent') || value.includes('success') || value.includes('deliver'))
		return 'success';
	if (value.includes('fail') || value.includes('error') || value.includes('reject')) return 'danger';
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

	const [categoryTypeId, setCategoryTypeId] = useState<number | null>(null);
	const [status, setStatus] = useState('');

	const filters = useMemo<NotificationLogFilters>(
		() => ({
			...(categoryTypeId != null ? { categoryTypeId } : {}),
			...(status.trim() ? { status: status.trim() } : {}),
		}),
		[categoryTypeId, status],
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

	const selectedCategory = categoryOptions.find((option) => option.value === categoryTypeId) ?? null;

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
				cell: ({ row }) => (
					<Badge variant={statusVariant(row.original.status)}>{row.original.status || '—'}</Badge>
				),
			},
			{
				id: 'error',
				header: t('admin.notify.log.col.error'),
				cell: ({ row }) => (
					<span className="text-red-700">{row.original.errorMessage ?? '—'}</span>
				),
			},
		],
		[t, categoryNameById],
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
		<div className="space-y-4">
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
				<Input
					label={t('admin.notify.log.filter.status')}
					value={status}
					onChange={(event) => setStatus(event.target.value)}
					placeholder={t('admin.notify.log.filter.statusPlaceholder')}
				/>
			</div>

			<DataTable
				columns={columns}
				data={logs}
				title={t('admin.notify.log.title')}
				aria-label={t('admin.notify.log.title')}
			/>
			{isLoading && <p className="text-sm text-zinc-500">{t('loading.default')}</p>}
		</div>
	);
}
