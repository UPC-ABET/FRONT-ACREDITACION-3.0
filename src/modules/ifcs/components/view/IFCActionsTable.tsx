'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, Card, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { VIEW_LABELS } from './viewLabels';
import type { Finding, FindingAction } from '../../types';

type ActionRow = FindingAction & { parentFindingCode: string };

type Props = { findings: Finding[] };

export function IFCActionsTable({ findings }: Props) {
	const { locale: lang } = useI18n();

	const data = useMemo<ActionRow[]>(
		() => findings.flatMap((f) => f.actions.map((a) => ({ ...a, parentFindingCode: f.code }))),
		[findings],
	);

	const columns = useMemo<ColumnDef<ActionRow>[]>(
		() => [
			{ accessorKey: 'code', header: VIEW_LABELS.colCode[lang] },
			{
				id: 'description',
				header: VIEW_LABELS.colDescription[lang],
				accessorFn: (row) => row.description?.[lang] ?? row.description?.es ?? '',
				cell: ({ row }) => (
					<span className="whitespace-pre-line text-base leading-relaxed">
						{row.original.description?.[lang] ?? row.original.description?.es ?? ''}
					</span>
				),
			},
			{
				id: 'completeness',
				accessorFn: (row) => row.completeness.code,
				header: VIEW_LABELS.colCompleteness[lang],
				cell: ({ row }) => (
					<Badge color={row.original.completeness.color}>
						{row.original.completeness.name?.[lang] ?? row.original.completeness.name?.es ?? ''}
					</Badge>
				),
			},
			{
				accessorKey: 'parentFindingCode',
				header: VIEW_LABELS.colFinding[lang],
			},
		],
		[lang],
	);

	return (
		<Card title={VIEW_LABELS.sectionActions[lang]}>
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
