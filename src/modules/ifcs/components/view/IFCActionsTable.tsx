'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { VIEW_LABELS } from './viewLabels';
import { COMPLETENESS_VARIANT } from '../../constants';
import type { Finding, FindingAction } from '../../services/types';

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
				accessorKey: 'completeness_code',
				header: VIEW_LABELS.col_completeness[lang],
				cell: ({ row }) => (
					<Badge variant={COMPLETENESS_VARIANT[row.original.completeness_code] ?? 'default'}>
						{row.original.completeness_name?.[lang] ?? row.original.completeness_name?.es ?? ''}
					</Badge>
				),
			},
			{
				accessorKey: 'parentFindingCode',
				header: VIEW_LABELS.col_finding[lang],
			},
		],
		[lang],
	);

	return (
		<section className="space-y-3">
			<h2 className="text-base font-bold uppercase tracking-wide text-zinc-700">
				{VIEW_LABELS.section_actions[lang]}
			</h2>
			<DataTable<ActionRow, unknown>
				columns={columns}
				data={data}
				showSearch={false}
				showPagination={false}
			/>
		</section>
	);
}
