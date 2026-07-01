'use client';

import { useMemo, useState } from 'react';
import { CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { ColumnDef } from '@tanstack/react-table';
import { Button, DataTable } from '@/shared/components';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useApiErrorToast } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import { useActivatePeriod, useConfigurationPeriods } from '../hooks';
import type { ConfigurationPeriod } from '../types';
import OpenPeriodDialog from './OpenPeriodDialog';

const ACTIVE_TONE = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
const INACTIVE_TONE = 'bg-gray-50 text-gray-600 ring-gray-500/20';

function formatDate(iso: string, locale: 'es' | 'en'): string {
	if (!iso) return '—';
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return new Intl.DateTimeFormat(locale === 'es' ? 'es-PE' : 'en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	}).format(date);
}

export default function PeriodsTable() {
	const { t, locale } = useI18n();
	const { data: periods, isLoading, isFetching, error } = useConfigurationPeriods();
	const { data: modalities } = useTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY);
	const activate = useActivatePeriod();
	const { showToast } = useApiErrorToast();
	const [dialogOpen, setDialogOpen] = useState(false);

	const modalityNameById = useMemo(() => {
		const map = new Map<number, string>();
		(modalities ?? []).forEach((modality) =>
			map.set(modality.id, modality.name[locale] ?? modality.code),
		);
		return map;
	}, [modalities, locale]);

	const handleActivate = (period: ConfigurationPeriod) => {
		activate.mutate(period.id, {
			onError: (err) => {
				const raw = err instanceof Error ? err.message : '';
				const translated = raw ? tryTranslate(t, raw) : raw;
				showToast(
					translated && translated !== raw
						? translated
						: t('admin.configuration.periods.error.activateFailed'),
					'error',
				);
			},
		});
	};

	const columns = useMemo<ColumnDef<ConfigurationPeriod>[]>(
		() => [
			{
				id: 'code',
				header: t('admin.configuration.periods.table.col.code'),
				cell: ({ row }) => row.original.code,
				meta: { cellClassName: 'font-mono text-zinc-700' },
			},
			{
				id: 'modality',
				header: t('admin.configuration.periods.table.col.modality'),
				cell: ({ row }) => modalityNameById.get(row.original.modalityTypeId) ?? '—',
			},
			{
				id: 'dates',
				header: t('admin.configuration.periods.table.col.dates'),
				cell: ({ row }) =>
					`${formatDate(row.original.startDate, locale)} — ${formatDate(row.original.endDate, locale)}`,
			},
			{
				id: 'status',
				header: t('admin.configuration.periods.table.col.status'),
				cell: ({ row }) => (
					<span
						className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
							row.original.isActive ? ACTIVE_TONE : INACTIVE_TONE
						}`}>
						<span
							aria-hidden
							className={`h-1.5 w-1.5 rounded-full ${
								row.original.isActive ? 'bg-emerald-500' : 'bg-gray-400'
							}`}
						/>
						{t(
							row.original.isActive
								? 'admin.configuration.periods.status.active'
								: 'admin.configuration.periods.status.inactive',
						)}
					</span>
				),
			},
			{
				id: 'actions',
				header: () => (
					<span className="sr-only">{t('admin.configuration.periods.table.col.actions')}</span>
				),
				cell: ({ row }) =>
					row.original.isActive ? null : (
						<div className="flex items-center justify-end gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
								onClick={() => handleActivate(row.original)}
								disabled={activate.isPending}
								aria-label={t('admin.configuration.periods.table.activate')}>
								<CheckCircleIcon className="h-5 w-5" />
							</Button>
						</div>
					),
				meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps -- column defs exclude the stable row handlers; rebuild only on label/locale/modality/pending changes
		[t, locale, modalityNameById, activate.isPending],
	);

	return (
		<>
			<DataTable<ConfigurationPeriod, unknown>
				columns={columns}
				data={periods ?? []}
				title={t('admin.configuration.periods.table.title')}
				description={t('admin.configuration.periods.table.description')}
				showSearch={false}
				isLoading={isLoading}
				isFetching={isFetching}
				errorMessage={error?.message}
				emptyMessage={t('admin.configuration.periods.table.empty')}
				aria-label={t('admin.configuration.periods.table.title')}
				actions={[
					{
						label: t('admin.configuration.periods.openButton'),
						onClick: () => setDialogOpen(true),
						icon: <PlusIcon className="h-4 w-4" />,
						buttonProps: { variant: 'primary' },
					},
				]}
			/>

			<OpenPeriodDialog open={dialogOpen} onOpenChange={setDialogOpen} />
		</>
	);
}
