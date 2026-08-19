'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable, TableEmptyState } from '@/shared/components';
import { useI18n } from '@/providers';
import { formatDateTime, localizedText } from '@/shared/utils';
import type { IFCStatusHistoryEntry } from '../../types';

type Props = { entries: IFCStatusHistoryEntry[] };

export function IFCStatusHistoryTable({ entries }: Props) {
	const { t, locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<IFCStatusHistoryEntry>[]>(
		() => [
			{
				id: 'status',
				accessorFn: (row) => localizedText(row.name, lang) || row.code,
				header: t('ifcs.statusHistory.table.col.status'),
				cell: ({ row, getValue }) => (
					<Badge color={row.original.color ?? undefined}>{getValue<string>()}</Badge>
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
				accessorFn: (row) => localizedText(row.comment, lang) || '—',
				header: t('ifcs.statusHistory.table.col.comment'),
				cell: ({ getValue }) => <span className="whitespace-pre-line">{getValue<string>()}</span>,
			},
			{
				id: 'by',
				accessorFn: (row) => row.by ?? '—',
				header: t('ifcs.statusHistory.table.col.by'),
				cell: ({ getValue }) => getValue<string>(),
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
