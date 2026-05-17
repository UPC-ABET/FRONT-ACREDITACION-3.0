'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components';
import { useI18n } from '@/providers';
import { effectiveStatus } from '../services/scope';
import type { IFCRow } from '../services/types';
import { StatusBadge } from './StatusBadge';

type Props = { rows: IFCRow[]; periodId: number | null };

const UNREG_LABEL: Record<string, string> = { en: 'Unregistered', es: 'Sin Registro' };

export function IFCTable({ rows, periodId }: Props) {
	const { t, locale: lang } = useI18n();

	const columns = useMemo<ColumnDef<IFCRow>[]>(
		() => [
			{ accessorKey: 'course_code', header: t('ifcs.table.code') },
			{
				accessorKey: 'program_label',
				header: t('ifcs.table.program'),
				cell: ({ row }) =>
					row.original.program_label?.[lang] ?? row.original.program_label?.es ?? '',
			},
			{
				accessorKey: 'course_name',
				header: t('ifcs.table.course'),
				cell: ({ row }) =>
					row.original.course_name?.[lang] ?? row.original.course_name?.es ?? '',
			},
			{
				accessorKey: 'coordinator_name',
				header: t('ifcs.table.coordinator'),
				cell: ({ row }) => row.original.coordinator_name ?? '—',
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
				cell: ({ row }) => {
					if (row.original.ifc) {
						return (
							<Link
								href={`/ifcs/${row.original.ifc.id}`}
								className="text-red-700 underline hover:text-red-500">
								{t('ifcs.table.actionView')}
							</Link>
						);
					}
					if (periodId !== null) {
						return (
							<Link
								href={`/ifcs/new?chart_id=${row.original.chart_id}&period_id=${periodId}`}
								className="text-red-700 underline hover:text-red-500">
								{t('ifcs.table.actionRegister')}
							</Link>
						);
					}
					return <span className="text-zinc-400">—</span>;
				},
			},
		],
		[t, lang, periodId],
	);

	return (
		<DataTable<IFCRow, unknown>
			columns={columns}
			data={rows}
			showSearch={false}
			showPagination
		/>
	);
}
