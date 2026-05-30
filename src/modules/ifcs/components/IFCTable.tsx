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
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { TYPE_CODES } from '@/modules/core';
import { usePdfDownload } from '../hooks/usePdfDownload';
import { effectiveStatus } from '../services/scope';
import type { IFCRow } from '../types';

type Props = {
	rows: IFCRow[];
	periodId: number | null;
	currentUserId: number | null;
	notifyingChartId: number | null;
	onNotify: (chartId: number) => void;
};

const UNREG_LABEL: Record<string, string> = { en: 'Unregistered', es: 'Sin Registro' };

const ICON_BTN =
	'inline-flex h-10 w-10 items-center justify-center rounded-md text-red-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50';

export function IFCTable({ rows, periodId, currentUserId, notifyingChartId, onNotify }: Props) {
	const { t, locale: lang } = useI18n();
	const { downloadOne, downloadingId, error: pdfError, clearError } = usePdfDownload();

	const columns = useMemo<ColumnDef<IFCRow>[]>(
		() => [
			{ accessorKey: 'courseCode', header: t('ifcs.table.code') },
			{
				accessorKey: 'programLabel',
				header: t('ifcs.table.program'),
				cell: ({ row }) =>
					row.original.programLabel?.[lang] ?? row.original.programLabel?.es ?? '',
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
				cell: ({ row }) => {
					const r = row.original;
					const status = effectiveStatus(r);
					const coordinatorId = r.coordinatorUserId;
					const isOwn =
						currentUserId != null &&
						coordinatorId != null &&
						Number(coordinatorId) === Number(currentUserId);
					const canNotify =
						!isOwn &&
						status !== TYPE_CODES.IFC_STATUS.APPROVED &&
						status !== TYPE_CODES.IFC_STATUS.SUBMITTED;

					if (r.ifc) {
						const ifcId = Number(r.ifc.id);
						const isApproved = r.ifc.statusCode === TYPE_CODES.IFC_STATUS.APPROVED;
						return (
							<div className="flex items-center gap-1">
								<Link
									href={`/ifcs/${r.ifc.id}`}
									className={ICON_BTN}
									aria-label={t('ifcs.table.actionView')}
									title={t('ifcs.table.actionView')}>
									<EyeIcon className="h-5 w-5" />
								</Link>
								{isApproved && (
									<button
										type="button"
										disabled={downloadingId === ifcId}
										onClick={() => downloadOne(ifcId)}
										aria-label={t('ifcs.pdf.downloadPdf')}
										title={t('ifcs.pdf.downloadPdf')}
										className={ICON_BTN}>
										<ArrowDownTrayIcon className="h-5 w-5" />
									</button>
								)}
								{canNotify && periodId !== null && (
									<button
										type="button"
										disabled={notifyingChartId === Number(r.chartId)}
										onClick={() => onNotify(Number(r.chartId))}
										aria-label={t('ifcs.notify.btn.tooltip')}
										title={t('ifcs.notify.btn.tooltip')}
										className={ICON_BTN}>
										<BellAlertIcon className="h-5 w-5" />
									</button>
								)}
							</div>
						);
					}
					if (periodId !== null) {
						return (
							<div className="flex items-center gap-1">
								<Link
									href={`/ifcs/new?chartId=${r.chartId}&periodId=${periodId}`}
									className={ICON_BTN}
									aria-label={t('ifcs.table.actionRegister')}
									title={t('ifcs.table.actionRegister')}>
									<PencilSquareIcon className="h-5 w-5" />
								</Link>
								{canNotify && (
									<button
										type="button"
										disabled={notifyingChartId === Number(r.chartId)}
										onClick={() => onNotify(Number(r.chartId))}
										aria-label={t('ifcs.notify.btn.tooltip')}
										title={t('ifcs.notify.btn.tooltip')}
										className={ICON_BTN}>
										<BellAlertIcon className="h-5 w-5" />
									</button>
								)}
							</div>
						);
					}
					return <span className="text-zinc-400">—</span>;
				},
			},
		],
		[t, lang, periodId, downloadOne, downloadingId, currentUserId, notifyingChartId, onNotify],
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
