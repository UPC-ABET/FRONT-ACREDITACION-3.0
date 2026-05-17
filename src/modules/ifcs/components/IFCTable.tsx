'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { effectiveStatus } from '../services/scope';
import type { IFCRow } from '../services/types';
import { StatusBadge } from './StatusBadge';

type Props = { rows: IFCRow[] };

const UNREG_LABEL: Record<string, string> = { en: 'Unregistered', es: 'Sin Registro' };

export function IFCTable({ rows }: Props) {
	const { t, locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<IFCRow>[]>(
		() => [
			{ accessorKey: 'course_code', header: t('ifcs.table.code') },
			{
				id: 'program',
				header: t('ifcs.table.program'),
				accessorFn: (row) => row.program_label[lang] ?? row.program_label.es ?? '',
			},
			{
				id: 'course',
				header: t('ifcs.table.course'),
				accessorFn: (row) => row.course_name[lang] ?? row.course_name.es ?? '',
			},
			{
				id: 'coordinator',
				header: t('ifcs.table.coordinator'),
				accessorFn: (row) => row.coordinator_name ?? '—',
			},
			{
				id: 'status',
				header: t('ifcs.table.status'),
				cell: ({ row }) => {
					const code = effectiveStatus(row.original);
					const label = row.original.ifc
						? (row.original.ifc.status_label[lang] ?? row.original.ifc.status_label.es ?? code)
						: (UNREG_LABEL[lang] ?? UNREG_LABEL.es);
					return <StatusBadge status={code} label={label} />;
				},
			},
			{
				id: 'actions',
				header: t('ifcs.table.actions'),
				cell: () => <span className="text-zinc-400">—</span>,
			},
		],
		[t, lang],
	);

	return (
		<DataTable<IFCRow, unknown>
			columns={columns}
			data={rows}
			showSearch
			showPagination
			searchPlaceholder={t('table.search.placeholder')}
		/>
	);
}
