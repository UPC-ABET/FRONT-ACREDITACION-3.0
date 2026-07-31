'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable, TableEmptyState } from '@/shared/components';
import { useI18n } from '@/providers';
import type { FindingActionRow } from '../../types';

type Props = { actions: FindingActionRow[] };

export function FindingActionsTable({ actions }: Props) {
	const { t, locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<FindingActionRow>[]>(
		() => [
			{ accessorKey: 'actionCode', header: t('ifcFindings.findingView.col.actionCode') },
			{
				id: 'description',
				header: t('ifcFindings.findingView.col.actionDesc'),
				accessorFn: (row) => row.description?.[lang] ?? row.description?.es ?? '',
				cell: ({ row }) => (
					<span className="whitespace-pre-line">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'completeness',
				accessorFn: (row) => row.completeness.code,
				header: t('ifcFindings.findingView.col.actionStatus'),
				cell: ({ row }) => (
					<Badge color={row.original.completeness.color}>
						{row.original.completeness.name?.[lang] ?? row.original.completeness.name?.es ?? ''}
					</Badge>
				),
			},
		],
		[t, lang],
	);

	if (actions.length === 0) {
		return <TableEmptyState message={t('ifcFindings.findingView.actionsEmpty')} />;
	}

	return (
		<DataTable<FindingActionRow, unknown>
			columns={columns}
			data={actions}
			showSearch={false}
			showPagination={false}
		/>
	);
}
