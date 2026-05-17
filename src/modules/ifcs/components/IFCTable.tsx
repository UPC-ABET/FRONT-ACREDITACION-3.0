'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, ErrorDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { TYPE_CODES } from '../constants';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { effectiveStatus } from '../services/scope';
import type { IFCRow } from '../services/types';
import { StatusBadge } from './StatusBadge';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

type Props = { rows: IFCRow[]; periodId: number | null };

const UNREG_LABEL: Record<string, string> = { en: 'Unregistered', es: 'Sin Registro' };

export function IFCTable({ rows, periodId }: Props) {
	const { t, locale: lang } = useI18n();
	const { downloadOne, downloadingId, error: pdfError, clearError } = usePdfDownload();

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
				cell: ({ row }) => row.original.course_name?.[lang] ?? row.original.course_name?.es ?? '',
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
					const r = row.original;
					if (r.ifc) {
						const ifcId = Number(r.ifc.id);
						const isApproved = r.ifc.status_code === TYPE_CODES.IFC_STATUS.APPROVED;
						return (
							<div className="flex items-center gap-2">
								<Link
									href={`/ifcs/${r.ifc.id}`}
									className="text-red-700 underline hover:text-red-500">
									{t('ifcs.table.actionView')}
								</Link>
								{isApproved && (
									<button
										type="button"
										disabled={downloadingId === ifcId}
										onClick={() => downloadOne(ifcId)}
										title={t('ifcs.pdf.downloadPdf')}
										className="text-red-700 hover:text-red-500 disabled:opacity-50">
										<ArrowDownTrayIcon className="h-4 w-4" />
									</button>
								)}
							</div>
						);
					}
					if (periodId !== null) {
						return (
							<Link
								href={`/ifcs/new?chart_id=${r.chart_id}&period_id=${periodId}`}
								className="text-red-700 underline hover:text-red-500">
								{t('ifcs.table.actionRegister')}
							</Link>
						);
					}
					return <span className="text-zinc-400">—</span>;
				},
			},
		],
		[t, lang, periodId, downloadOne, downloadingId],
	);

	return (
		<>
			<DataTable<IFCRow, unknown>
				columns={columns}
				data={rows}
				showSearch={false}
				showPagination
			/>
			{pdfError && (
				<ErrorDialog isOpen onClose={clearError} message={tryTranslate(t, pdfError)} />
			)}
		</>
	);
}
