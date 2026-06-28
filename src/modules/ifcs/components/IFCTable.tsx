'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
	ArrowDownTrayIcon,
	BellAlertIcon,
	EyeIcon,
	PencilSquareIcon,
} from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge, DataTable, Toast } from '@/shared/components';
import { Button, buttonVariants, cn } from '@/shared';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { TYPE_CODES } from '@/shared/constants';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { effectiveStatus } from '../services/scope';
import type { IFCRow } from '../types';

type Props = {
	rows: IFCRow[];
	periodId: number | null;
	canNotify: boolean;
	notifyingChartId: number | null;
	onNotify: (chartId: number) => void;
};

const UNREG_LABEL: Record<string, string> = { en: 'Unregistered', es: 'Sin Registro' };

export function IFCTable({ rows, periodId, canNotify, notifyingChartId, onNotify }: Props) {
	const { t, locale: lang } = useI18n();
	const { downloadOne, downloadingId, error: pdfError, clearError } = usePdfDownload();

	const columns = useMemo<ColumnDef<IFCRow>[]>(
		() => [
			{ accessorKey: 'courseCode', header: t('ifcs.table.code') },
			{
				accessorKey: 'programLabel',
				header: t('ifcs.table.program'),
				cell: ({ row }) => row.original.programLabel?.[lang] ?? row.original.programLabel?.es ?? '',
			},
			{
				accessorKey: 'courseName',
				header: t('ifcs.table.course'),
				cell: ({ row }) => row.original.courseName?.[lang] ?? row.original.courseName?.es ?? '',
			},
			{
				accessorKey: 'coordinatorName',
				header: t('ifcs.table.coordinator'),
				cell: ({ row }) => row.original.coordinatorName ?? '—',
			},
			{
				id: 'status',
				header: t('ifcs.table.status'),
				cell: ({ row }) => {
					const code = effectiveStatus(row.original);
					const label = row.original.ifc
						? (row.original.ifc.statusLabel[lang] ?? row.original.ifc.statusLabel.es ?? code)
						: (UNREG_LABEL[lang] ?? UNREG_LABEL.es);
					return <Badge color={row.original.ifc?.statusColor}>{label}</Badge>;
				},
			},
			{
				id: 'actions',
				header: t('ifcs.table.actions'),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
				cell: ({ row }) => {
					const r = row.original;
					const status = effectiveStatus(r);
					const showNotify =
						canNotify &&
						status !== TYPE_CODES.IFC_STATUS.APPROVED &&
						status !== TYPE_CODES.IFC_STATUS.SUBMITTED;

					if (r.ifc) {
						const ifcId = Number(r.ifc.id);
						const isApproved = r.ifc.statusCode === TYPE_CODES.IFC_STATUS.APPROVED;
						return (
							<div className="flex items-center justify-end gap-1">
								<Link
									href={`/ifcs/${r.ifc.id}`}
									className={cn(
										buttonVariants({ variant: 'ghost', size: 'icon' }),
										'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
									)}
									aria-label={t('ifcs.table.actionView')}
									title={t('ifcs.table.actionView')}>
									<EyeIcon className="h-5 w-5" />
								</Link>
								{isApproved && (
									<Button
										variant="ghost"
										size="icon"
										className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
										disabled={downloadingId === ifcId}
										onClick={() => downloadOne(ifcId)}
										aria-label={t('ifcs.pdf.downloadPdf')}
										title={t('ifcs.pdf.downloadPdf')}>
										<ArrowDownTrayIcon className="h-5 w-5" />
									</Button>
								)}
								{showNotify && periodId !== null && (
									<Button
										variant="ghost"
										size="icon"
										className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
										disabled={notifyingChartId === Number(r.chartId)}
										onClick={() => onNotify(Number(r.chartId))}
										aria-label={t('ifcs.notify.btn.tooltip')}
										title={t('ifcs.notify.btn.tooltip')}>
										<BellAlertIcon className="h-5 w-5" />
									</Button>
								)}
							</div>
						);
					}
					if (periodId !== null) {
						return (
							<div className="flex items-center justify-end gap-1">
								<Link
									href={`/ifcs/new?chartId=${r.chartId}&periodId=${periodId}`}
									className={cn(
										buttonVariants({ variant: 'ghost', size: 'icon' }),
										'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
									)}
									aria-label={t('ifcs.table.actionRegister')}
									title={t('ifcs.table.actionRegister')}>
									<PencilSquareIcon className="h-5 w-5" />
								</Link>
								{showNotify && (
									<Button
										variant="ghost"
										size="icon"
										className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
										disabled={notifyingChartId === Number(r.chartId)}
										onClick={() => onNotify(Number(r.chartId))}
										aria-label={t('ifcs.notify.btn.tooltip')}
										title={t('ifcs.notify.btn.tooltip')}>
										<BellAlertIcon className="h-5 w-5" />
									</Button>
								)}
							</div>
						);
					}
					return <span className="text-zinc-400">—</span>;
				},
			},
		],
		[t, lang, periodId, canNotify, downloadOne, downloadingId, notifyingChartId, onNotify],
	);

	return (
		<>
			<DataTable<IFCRow, unknown>
				columns={columns}
				data={rows}
				showSearch={false}
				showPagination
				aria-label={t('ifcs.table.ariaLabel')}
			/>
			{pdfError && (
				<Toast isOpen type="error" onClose={clearError} message={tryTranslate(t, pdfError)} />
			)}
		</>
	);
}
