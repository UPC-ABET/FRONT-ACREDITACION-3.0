'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable, TableEmptyState } from '@/shared/components';
import { useI18n } from '@/providers';
import { formatDateTime } from '@/shared/utils';
import type { IFCStatusHistoryEntry } from '../../types';

type Props = { entries: IFCStatusHistoryEntry[] };

export function IFCStatusHistoryTable({ entries }: Props) {
	const { t, locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<IFCStatusHistoryEntry>[]>(
		() => [
			{
				id: 'status',
				accessorFn: (row) => row.name[lang] ?? row.name.es ?? row.code,
				header: t('ifcs.statusHistory.table.col.status'),
				cell: ({ row }) => (
					<Badge color={row.original.color ?? undefined}>
						{row.original.name[lang] ?? row.original.name.es ?? row.original.code}
					</Badge>
				),
			},
			{
				id: 'date',
				accessorFn: (row) => row.at,
				header: t('ifcs.statusHistory.table.col.date'),
				cell: ({ row }) => formatDateTime(row.original.at),
			},
			{
				id: 'comment',
				accessorFn: (row) => row.comment?.[lang] ?? row.comment?.es ?? '',
				header: t('ifcs.statusHistory.table.col.comment'),
				cell: ({ row }) => (
					<span className="whitespace-pre-line">
						{row.original.comment?.[lang] ?? row.original.comment?.es ?? '—'}
					</span>
				),
			},
			{
				id: 'by',
				accessorFn: (row) => row.by ?? '',
				header: t('ifcs.statusHistory.table.col.by'),
				cell: ({ row }) => row.original.by ?? '—',
			},
		],
		[t, lang],
	);

	if (entries.length === 0) {
		return <TableEmptyState message={t('ifcs.statusHistory.table.empty')} />;
	}

	return (
		<DataTable<IFCStatusHistoryEntry, unknown>
			columns={columns}
			data={entries}
			showSearch={false}
			showPagination={false}
			aria-label={t('ifcs.statusHistory.table.ariaLabel')}
		/>
	);
}
