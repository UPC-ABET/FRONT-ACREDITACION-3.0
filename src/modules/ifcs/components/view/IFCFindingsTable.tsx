'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { VIEW_LABELS } from './viewLabels';
import type { Finding } from '../../services/types';

type Props = { findings: Finding[] };

export function IFCFindingsTable({ findings }: Props) {
	const { locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<Finding>[]>(
		() => [
			{ accessorKey: 'code', header: VIEW_LABELS.col_code[lang] },
			{
				id: 'description',
				header: VIEW_LABELS.col_description[lang],
				accessorFn: (row) => row.description?.[lang] ?? row.description?.es ?? '',
				cell: ({ row }) => (
					<span className="whitespace-pre-line">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'criticality',
				header: VIEW_LABELS.col_criticality[lang],
				cell: ({ row }) =>
					row.original.criticality?.name?.[lang] ?? row.original.criticality?.name?.es ?? '',
			},
		],
		[lang],
	);

	return (
		<section className="space-y-3">
			<h2 className="text-base font-bold uppercase tracking-wide text-zinc-700">
				{VIEW_LABELS.section_findings[lang]}
			</h2>
			<DataTable<Finding, unknown>
				columns={columns}
				data={findings}
				showSearch={false}
				showPagination={false}
			/>
		</section>
	);
}
