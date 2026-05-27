'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable, TableEmptyState } from '@/shared/components';
import { useI18n } from '@/providers';
import type { FindingActionRow } from '../../types';
import { FINDING_VIEW_LABELS as L } from './findingViewLabels';

type Props = { actions: FindingActionRow[] };

export function FindingActionsTable({ actions }: Props) {
	const { locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<FindingActionRow>[]>(
		() => [
			{ accessorKey: 'action_code', header: L.col_action_code[lang] },
			{
				id: 'description',
				header: L.col_action_desc[lang],
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
				header: L.col_action_status[lang],
				cell: ({ row }) => (
					<Badge color={row.original.completeness.color}>
						{row.original.completeness.name?.[lang] ?? row.original.completeness.name?.es ?? ''}
					</Badge>
				),
			},
		],
		[lang],
	);

	if (actions.length === 0) {
		return <TableEmptyState message={L.actions_empty[lang]} />;
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
