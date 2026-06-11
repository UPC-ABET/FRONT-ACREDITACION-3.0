'use client';

import { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button, Card } from '@/shared/components';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useApiErrorToast } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import { useActivatePeriod, useConfigurationPeriods } from '../hooks';
import type { ConfigurationPeriod } from '../types';

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
	const { data: periods, isLoading, error } = useConfigurationPeriods();
	const { data: modalities } = useTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY);
	const activate = useActivatePeriod();
	const { showToast } = useApiErrorToast();

	const modalityNameById = useMemo(() => {
		const map = new Map<number, string>();
		(modalities ?? []).forEach((m) => map.set(m.id, m.name[locale] ?? m.code));
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

	const rows = periods ?? [];

	return (
		<Card
			title={t('admin.configuration.periods.table.title')}
			description={t('admin.configuration.periods.table.description')}>
			{isLoading && (
				<p className="py-8 text-center text-sm text-gray-500">
					{t('admin.configuration.periods.table.loading')}
				</p>
			)}
			{error && <p className="py-4 text-sm text-red-600">{error.message}</p>}
			{!isLoading && !error && rows.length === 0 && (
				<p className="py-12 text-center text-sm text-gray-400">
					{t('admin.configuration.periods.table.empty')}
				</p>
			)}

			{rows.length > 0 && (
				<div className="-mx-4 overflow-x-auto sm:-mx-6">
					<div className="inline-block min-w-full align-middle">
						<table className="min-w-full divide-y divide-gray-200 text-sm">
							<thead className="bg-gray-50/60">
								<tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
									<th scope="col" className="px-4 py-3 sm:px-6">
										{t('admin.configuration.periods.table.col.code')}
									</th>
									<th scope="col" className="px-4 py-3">
										{t('admin.configuration.periods.table.col.modality')}
									</th>
									<th scope="col" className="px-4 py-3 whitespace-nowrap">
										{t('admin.configuration.periods.table.col.dates')}
									</th>
									<th scope="col" className="px-4 py-3">
										{t('admin.configuration.periods.table.col.status')}
									</th>
									<th scope="col" className="px-4 py-3 text-right sm:px-6">
										<span className="sr-only">
											{t('admin.configuration.periods.table.col.actions')}
										</span>
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100 bg-white">
								{rows.map((period) => {
									const modalityLabel = modalityNameById.get(period.modalityTypeId) ?? '—';
									return (
										<tr key={period.id} className="transition-colors hover:bg-gray-50/60">
											<td className="px-4 py-4 font-mono text-xs whitespace-nowrap text-gray-700 sm:px-6">
												{period.code}
											</td>
											<td className="px-4 py-4 text-gray-700">{modalityLabel}</td>
											<td className="px-4 py-4 whitespace-nowrap text-gray-600">
												{formatDate(period.startDate, locale)} —{' '}
												{formatDate(period.endDate, locale)}
											</td>
											<td className="px-4 py-4">
												<span
													className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
														period.isActive ? ACTIVE_TONE : INACTIVE_TONE
													}`}>
													<span
														aria-hidden
														className={`h-1.5 w-1.5 rounded-full ${
															period.isActive ? 'bg-emerald-500' : 'bg-gray-400'
														}`}
													/>
													{t(
														period.isActive
															? 'admin.configuration.periods.status.active'
															: 'admin.configuration.periods.status.inactive',
													)}
												</span>
											</td>
											<td className="px-4 py-4 whitespace-nowrap text-right sm:px-6">
												{!period.isActive && (
													<Button
														variant="secondary"
														size="sm"
														onClick={() => handleActivate(period)}
														disabled={activate.isPending}>
														<CheckCircle2 className="h-3.5 w-3.5" />
														<span className="hidden sm:inline">
															{t('admin.configuration.periods.table.activate')}
														</span>
													</Button>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</Card>
	);
}
