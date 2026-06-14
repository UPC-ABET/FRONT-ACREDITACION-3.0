'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { PortfolioStatusBadge } from '../portfolio-status-badge';
import type { PortfolioProjectResponse } from '../../types';

type Props = {
	rows: PortfolioProjectResponse[];
	onDelete?: (project: PortfolioProjectResponse) => void;
};

const ICON_BTN =
	'inline-flex h-9 w-9 items-center justify-center rounded-md text-red-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50';

export function PortfolioTable({ rows, onDelete }: Props) {
	const { t } = useI18n();

	const columns = useMemo<ColumnDef<PortfolioProjectResponse>[]>(
		() => [
			{
				accessorKey: 'code',
				header: t('portfolio.table.code'),
			},
			{
				accessorKey: 'name',
				header: t('portfolio.table.name'),
				cell: ({ row }) => (
					<span className="max-w-xs truncate block" title={row.original.name}>
						{row.original.name}
					</span>
				),
			},
			{
				id: 'company',
				header: t('portfolio.table.company'),
				cell: ({ row }) => row.original.company?.name ?? '—',
			},
			{
				id: 'students',
				header: t('portfolio.table.students'),
				cell: ({ row }) => {
					const p = row.original;
					const students = [p.studentOne, p.studentTwo].filter(Boolean);
					if (students.length === 0) return <span className="text-zinc-400">—</span>;
					return (
						<div className="flex flex-col gap-0.5">
							{students.map((s) => (
								<span key={s!.id} className="text-xs">
									{s!.firstName} {s!.lastName}
								</span>
							))}
						</div>
					);
				},
			},
			{
				id: 'status',
				header: t('portfolio.table.status'),
				cell: ({ row }) => <PortfolioStatusBadge status={row.original.status} />,
			},
			{
				id: 'isFromUPC',
				header: t('portfolio.table.origin'),
				cell: ({ row }) =>
					row.original.isFromUPC ? (
						<span className="text-xs font-semibold text-blue-600">{t('portfolio.table.originUpc')}</span>
					) : (
						<span className="text-xs font-semibold text-zinc-500">{t('portfolio.table.external')}</span>
					),
			},
			{
				id: 'actions',
				header: t('portfolio.table.actions'),
				cell: ({ row }) => {
					const p = row.original;
					return (
						<div className="flex items-center gap-1">
							<Link
								href={`/portfolio/${p.id}`}
								className={ICON_BTN}
								aria-label={t('portfolio.table.actionView')}
								title={t('portfolio.table.actionView')}>
								<EyeIcon className="h-5 w-5" />
							</Link>
							{onDelete && (
								<button
									type="button"
									onClick={() => onDelete(p)}
									className={ICON_BTN}
									aria-label={t('portfolio.table.actionDelete')}
									title={t('portfolio.table.actionDelete')}>
									<TrashIcon className="h-5 w-5" />
								</button>
							)}
						</div>
					);
				},
			},
		],
		[t, onDelete],
	);

	return (
		<DataTable<PortfolioProjectResponse, unknown>
			columns={columns}
			data={rows}
			showSearch
			showPagination={false}
			aria-label={t('portfolio.table.ariaLabel')}
		/>
	);
}
