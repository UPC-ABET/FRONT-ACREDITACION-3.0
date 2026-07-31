'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import type { Finding } from '../../types';

type Props = { findings: Finding[] };

export function IFCFindingsTable({ findings }: Props) {
	const { t, locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<Finding>[]>(
		() => [
			{ accessorKey: 'code', header: t('ifcs.view.col.code') },
			{
				id: 'description',
				header: t('ifcs.view.col.description'),
				accessorFn: (row) => row.description?.[lang] ?? row.description?.es ?? '',
				cell: ({ row }) => (
					<span className="whitespace-pre-line leading-relaxed">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'criticality',
				header: t('ifcs.view.col.criticality'),
				cell: ({ row }) => {
					const c = row.original.criticality;
					const label = c?.name?.[lang] ?? c?.name?.es ?? '';
					if (!label) return '';
					return <Badge color={c?.color}>{label}</Badge>;
				},
			},
		],
		[t, lang],
	);

	return (
		<Card title={t('ifcs.view.section.findings')}>
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
