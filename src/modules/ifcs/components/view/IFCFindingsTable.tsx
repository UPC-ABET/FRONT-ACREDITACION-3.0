'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { VIEW_LABELS } from './viewLabels';
import type { Finding } from '../../types';

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
					<span className="whitespace-pre-line text-base leading-relaxed">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'criticality',
				header: VIEW_LABELS.col_criticality[lang],
				cell: ({ row }) => {
					const c = row.original.criticality;
					const label = c?.name?.[lang] ?? c?.name?.es ?? '';
					if (!label) return '';
					return <Badge color={c?.color}>{label}</Badge>;
				},
			},
		],
		[lang],
	);

	return (
		<Card title={VIEW_LABELS.section_findings[lang]}>
			<div className="overflow-x-auto">
				<DataTable<Finding, unknown>
					columns={columns}
					data={findings}
					showSearch={false}
					showPagination={false}
				/>
			</div>
		</Card>
	);
}
