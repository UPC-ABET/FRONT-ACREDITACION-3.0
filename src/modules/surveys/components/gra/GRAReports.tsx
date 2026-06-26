'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button, Select, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import { campusesService } from '@/modules/academic';
import { PerceptionReportPanel } from '../shared/PerceptionReportPanel';
import {
	downloadGRASurveys,
	generateGRAPerceptionPdf,
	generateGRADashboard,
	listGRAOutcomes,
} from '../../services';

interface OptionItem {
	value: string | number;
	label: string;
}

interface GRAReportsProps {
	readonly programId?: number;
}

export function GRAReports({ programId }: GRAReportsProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});
	const [downloading, setDownloading] = useState(false);

	const { data: commissionOptions = [] } = useQuery({
		queryKey: ['gra-commissions', programId],
		queryFn: () => listGRAOutcomes({ programId: programId as number }),
		enabled: Boolean(programId),
		select: (groups) => groups.map((g) => ({ value: g.commissionId, label: g.commissionName })),
	});

	const { data: campusOptions = [] } = useQuery({
		queryKey: ['gra-campuses'],
		queryFn: () => campusesService.getAll().then((res) => res.data ?? []),
		select: (campuses) =>
			campuses.map((item) => ({ value: item.id, label: item.name?.es ?? item.code })),
	});

	// Dashboard metrics — loaded on demand when "Generar" is clicked
	const dashboardMutation = useMutation({
		mutationFn: () =>
			generateGRADashboard({
				academicPeriodId: academicPeriodId ?? undefined,
				programId: programId || undefined,
				campusId: campus ? Number(campus.value) : undefined,
			}),
		onError: (e) =>
			setToast({ open: true, type: 'error', msg: tryTranslate(t, getErrorMessage(e)) }),
	});
	const dashboard = dashboardMutation.data;

	async function handleDownload() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloading(true);
		try {
			await downloadGRASurveys(academicPeriodId, programId ?? 0);
		} catch (e) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (e as Error).message) });
		} finally {
			setDownloading(false);
		}
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			{/* Report title + Excel download */}
			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-bold text-zinc-800">{t('surveys.gra.reports.title')}</h3>
					<p className="text-sm text-zinc-500 mt-1">{t('surveys.gra.reports.description')}</p>
				</div>
				<Button
					variant="surface"
					onClick={handleDownload}
					disabled={downloading}
					loading={downloading}>
					<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
					{t('surveys.shared.downloadExcel')}
				</Button>
			</div>

			{/* Commission + campus filters */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Select
					name="gra-commission"
					label={t('surveys.perception.commission')}
					placeholder={t('surveys.perception.allCommissions')}
					isClearable
					isSearchable
					options={commissionOptions}
					value={commission}
					onChange={(_name, value) =>
						setCommission(value && !Array.isArray(value) ? (value as OptionItem) : null)
					}
				/>
				<Select
					name="gra-campus"
					label={t('surveys.perception.campus')}
					placeholder={t('surveys.perception.allCampuses')}
					isClearable
					isSearchable
					options={campusOptions}
					value={campus}
					onChange={(_name, value) =>
						setCampus(value && !Array.isArray(value) ? (value as OptionItem) : null)
					}
				/>
			</div>

			{/* Dashboard metrics card — shown after Generate is clicked */}
			{dashboard && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
					<MetricBox
						label={t('surveys.shared.totalSurveys')}
						value={dashboard.summary.totalSurveys}
					/>
					<MetricBox
						label={t('surveys.shared.completed')}
						value={dashboard.summary.completed ?? 0}
						color="text-green-700"
					/>
					<MetricBox
						label={t('surveys.shared.pending')}
						value={dashboard.summary.pending ?? 0}
						color="text-amber-600"
					/>
					<MetricBox
						label={t('surveys.shared.completionRate')}
						value={`${dashboard.summary.completionRatePct ?? 0}%`}
						color="text-blue-700"
					/>
				</div>
			)}

			{/* Perception PDF report generator — Generate button also triggers dashboard */}
			<PerceptionReportPanel
				programId={programId}
				generate={async (filters) => {
					dashboardMutation.mutate();
					return generateGRAPerceptionPdf(filters);
				}}
				externalFilters={{
					commissionId: commission ? Number(commission.value) : undefined,
					campusId: campus ? Number(campus.value) : undefined,
					lang: locale === 'en' ? 'en' : 'es',
				}}
			/>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}

function MetricBox({
	label,
	value,
	color = 'text-zinc-800',
}: {
	label: string;
	value: number | string;
	color?: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-1 py-2">
			<ChartBarIcon className="h-5 w-5 text-zinc-400" />
			<span className={`text-2xl font-bold ${color}`}>{value}</span>
			<span className="text-xs text-zinc-500 text-center">{label}</span>
		</div>
	);
}
