'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Button, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { CRITICALITY_VARIANT } from '../../constants';
import type { FindingRow } from '../../services/types';

type Props = {
	rows: FindingRow[];
	onView: (findingId: number) => void;
	onDelete: (row: FindingRow) => void;
};

export function FindingsTable({ rows, onView, onDelete }: Props) {
	const { t, locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<FindingRow>[]>(
		() => [
			{
				accessorKey: 'criticality_code',
				header: t('ifcFindings.col.criticality'),
				cell: ({ row }) => {
					const code = row.original.criticality_code;
					const label =
						row.original.criticality_name?.[lang] ?? row.original.criticality_name?.es ?? code;
					return <Badge variant={CRITICALITY_VARIANT[code] ?? 'default'}>{label}</Badge>;
				},
			},
			{
				accessorKey: 'finding_code',
				header: t('ifcFindings.col.code'),
			},
			{
				accessorKey: 'academic_period_code',
				header: t('ifcFindings.col.period'),
			},
			{
				accessorKey: 'description',
				header: t('ifcFindings.col.description'),
				cell: ({ row }) => row.original.description?.[lang] ?? row.original.description?.es ?? '',
			},
			{
				id: 'actions',
				header: t('ifcFindings.col.actions'),
				cell: ({ row }) => (
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onView(row.original.id)}
							className="text-red-700 hover:text-red-500">
							{t('ifcFindings.action.view')}
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => onDelete(row.original)}
							className="text-red-700 hover:text-red-500">
							{t('ifcFindings.action.delete')}
						</Button>
					</div>
				),
			},
		],
		[t, lang, onView, onDelete],
	);

	return (
		<DataTable<FindingRow, unknown>
			columns={columns}
			data={rows}
			showSearch={false}
			showPagination
		/>
	);
}
