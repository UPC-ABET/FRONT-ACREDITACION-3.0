'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { COMPLETENESS_VARIANT } from '../../constants';
import type { FindingActionRow } from '../../services/types';
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
				accessorKey: 'completeness_code',
				header: L.col_action_status[lang],
				cell: ({ row }) => (
					<Badge
						variant={COMPLETENESS_VARIANT[row.original.completeness_code] ?? 'default'}>
						{row.original.completeness_name?.[lang] ??
							row.original.completeness_name?.es ??
							''}
					</Badge>
				),
			},
		],
		[lang],
	);

	if (actions.length === 0) {
		return (
			<p className="text-sm text-zinc-500 italic text-center py-6">
				{L.actions_empty[lang]}
			</p>
		);
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
