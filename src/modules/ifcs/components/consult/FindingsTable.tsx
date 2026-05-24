'use client';

import { useMemo } from 'react';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import type { FindingRow } from '../../services/types';

type Props = {
	rows: FindingRow[];
	onView: (findingId: number) => void;
	onDelete: (row: FindingRow) => void;
};

const ICON_BTN =
	'inline-flex h-10 w-10 items-center justify-center rounded-md text-red-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50';

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
					return <Badge color={row.original.criticality_color}>{label}</Badge>;
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
				cell: ({ row }) => (
					<span className="whitespace-pre-line text-base leading-relaxed">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'actions',
				header: t('ifcFindings.col.actions'),
				cell: ({ row }) => (
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => onView(row.original.id)}
							aria-label={t('ifcFindings.action.view')}
							title={t('ifcFindings.action.view')}
							className={ICON_BTN}>
							<EyeIcon className="h-5 w-5" />
						</button>
						<button
							type="button"
							onClick={() => onDelete(row.original)}
							aria-label={t('ifcFindings.action.delete')}
							title={t('ifcFindings.action.delete')}
							className={ICON_BTN}>
							<TrashIcon className="h-5 w-5" />
						</button>
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
