'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { COMPLETENESS_VARIANT } from '../../constants';
import type { PreviousAction } from '../../services/types';
import { IFC_SHARED_LABELS } from './ifc.labels';

type Props = {
	previousActions: PreviousAction[] | undefined;
};

export function PreviousActionsTable({ previousActions }: Props) {
	const { locale: lang } = useI18n();
	const rows = previousActions ?? [];

	const columns = useMemo<ColumnDef<PreviousAction>[]>(
		() => [
			{ accessorKey: 'code', header: IFC_SHARED_LABELS.col_code[lang] },
			{
				id: 'description',
				header: IFC_SHARED_LABELS.col_description[lang],
				accessorFn: (row) => row.description?.[lang] ?? row.description?.es ?? '',
				cell: ({ row }) => (
					<span className="whitespace-pre-line text-base leading-relaxed">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				accessorKey: 'academic_period_code',
				header: IFC_SHARED_LABELS.col_period[lang],
				cell: ({ row }) => (
					<span className="tabular-nums text-zinc-700">{row.original.academic_period_code}</span>
				),
			},
			{
				accessorKey: 'completeness_code',
				header: IFC_SHARED_LABELS.col_completeness[lang],
				cell: ({ row }) => (
					<Badge variant={COMPLETENESS_VARIANT[row.original.completeness_code] ?? 'default'}>
						{row.original.completeness_name?.[lang] ?? row.original.completeness_name?.es ?? ''}
					</Badge>
				),
			},
		],
		[lang],
	);

	if (rows.length === 0) return null;

	return (
		<Card title={IFC_SHARED_LABELS.section_previous_actions[lang]}>
			<div className="overflow-x-auto">
				<DataTable<PreviousAction, unknown>
					columns={columns}
					data={rows}
					showSearch={false}
					showPagination={false}
				/>
			</div>
		</Card>
	);
}
