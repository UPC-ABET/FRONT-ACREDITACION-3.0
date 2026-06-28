'use client';

import { useMemo } from 'react';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable } from '@/shared/components';
import { Button } from '@/shared';
import { useI18n } from '@/providers';
import type { FindingRow } from '../../types';

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
				accessorKey: 'criticalityCode',
				header: t('ifcFindings.col.criticality'),
				cell: ({ row }) => {
					const code = row.original.criticalityCode;
					const label =
						row.original.criticalityName?.[lang] ?? row.original.criticalityName?.es ?? code;
					return <Badge color={row.original.criticalityColor}>{label}</Badge>;
				},
			},
			{
				accessorKey: 'findingCode',
				header: t('ifcFindings.col.code'),
			},
			{
				accessorKey: 'academicPeriodCode',
				header: t('ifcFindings.col.period'),
			},
			{
				accessorKey: 'description',
				header: t('ifcFindings.col.description'),
				cell: ({ row }) => (
					<span className="whitespace-pre-line leading-relaxed">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'actions',
				header: t('ifcFindings.col.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => (
					<div className="flex items-center justify-end gap-1">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onView(row.original.id)}
							aria-label={t('ifcFindings.action.view')}
							title={t('ifcFindings.action.view')}>
							<EyeIcon className="h-5 w-5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onDelete(row.original)}
							aria-label={t('ifcFindings.action.delete')}
							title={t('ifcFindings.action.delete')}
							className="text-red-600 hover:bg-red-50">
							<TrashIcon className="h-5 w-5" />
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
			aria-label={t('ifcFindings.table.ariaLabel')}
		/>
	);
}
