'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import type { Finding, FindingAction } from '../../types';

type ActionRow = FindingAction & { parentFindingCode: string };

type Props = { findings: Finding[] };

export function IFCActionsTable({ findings }: Props) {
	const { t, locale: lang } = useI18n();

	const data = useMemo<ActionRow[]>(
		() => findings.flatMap((f) => f.actions.map((a) => ({ ...a, parentFindingCode: f.code }))),
		[findings],
	);

	const columns = useMemo<ColumnDef<ActionRow>[]>(
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
				id: 'completeness',
				accessorFn: (row) => row.completeness.code,
				header: t('ifcs.view.col.completeness'),
				cell: ({ row }) => (
					<Badge color={row.original.completeness.color}>
						{row.original.completeness.name?.[lang] ?? row.original.completeness.name?.es ?? ''}
					</Badge>
				),
			},
			{
				accessorKey: 'parentFindingCode',
				header: t('ifcs.view.col.finding'),
			},
		],
		[t, lang],
	);

	return (
		<Card title={t('ifcs.view.section.actions')}>
			<div className="overflow-x-auto">
				<DataTable<ActionRow, unknown>
					columns={columns}
					data={data}
					showSearch={false}
					showPagination={false}
				/>
			</div>
		</Card>
	);
}
