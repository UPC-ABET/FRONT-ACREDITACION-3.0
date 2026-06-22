'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { useGRAReports } from '../../hooks';
import { downloadGRASurveys } from '../../services';

interface ProgramRow {
	programName?: string | { es?: string; en?: string };
	programCode?: string;
	completed: number;
	pending: number;
	total: number;
}

function toText(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const picked = obj.es ?? obj.en;
		if (typeof picked === 'string') return picked;
	}
	return '';
}

export function GRAReports() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { loading, error, reportData, generate } = useGRAReports();

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});
	const [downloading, setDownloading] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the hook's async error into dismissible toast state; toast is user-mutable so it can't be derived during render
		if (error) setToast({ open: true, type: 'error', msg: tryTranslate(t, error) });
	}, [error, t]);

	async function handleGenerate() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		await generate({ academicPeriodId });
	}

	async function handleDownload() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		setDownloading(true);
		try {
			await downloadGRASurveys(academicPeriodId);
		} catch (e) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, (e as Error).message) });
		} finally {
			setDownloading(false);
		}
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	const byProgram = (reportData?.byProgram ?? []) as ProgramRow[];

	return (
		<div className="max-w-2xl space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">{t('surveys.gra.reports.title')}</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.gra.reports.description')}</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<Button onClick={handleGenerate} disabled={loading} loading={loading}>
					{t('surveys.shared.generateDashboard')}
				</Button>
				<Button
					variant="surface"
					onClick={handleDownload}
					disabled={downloading}
					loading={downloading}>
					<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
					{t('surveys.shared.downloadExcel')}
				</Button>
			</div>

			{reportData && (
				<div className="space-y-4">
					<div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
						<p className="text-sm font-bold text-zinc-700">{t('surveys.shared.summary')}</p>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div>
								<span className="text-xs text-zinc-500 block">
									{t('surveys.shared.totalSurveys')}
								</span>
								<span className="font-semibold">{reportData.summary?.totalSurveys ?? '—'}</span>
							</div>
							{reportData.summary?.completed !== undefined && (
								<div>
									<span className="text-xs text-zinc-500 block">
										{t('surveys.shared.completed')}
									</span>
									<span className="font-semibold text-green-700">
										{reportData.summary.completed}
									</span>
								</div>
							)}
							{reportData.summary?.pending !== undefined && (
								<div>
									<span className="text-xs text-zinc-500 block">{t('surveys.shared.pending')}</span>
									<span className="font-semibold text-amber-700">{reportData.summary.pending}</span>
								</div>
							)}
							{reportData.summary?.completionRatePct !== undefined && (
								<div>
									<span className="text-xs text-zinc-500 block">
										{t('surveys.shared.completionRate')}
									</span>
									<span className="font-semibold">{reportData.summary.completionRatePct}%</span>
								</div>
							)}
						</div>

						{reportData.summary?.completionRatePct !== undefined && (
							<div>
								<div className="flex justify-between text-xs text-zinc-500 mb-1">
									<span>Progreso global</span>
									<span>{reportData.summary.completionRatePct}%</span>
								</div>
								<div className="h-2 bg-zinc-200 rounded-full overflow-hidden">
									<div
										className="h-2 bg-green-500 rounded-full transition-all duration-500"
										style={{ width: `${reportData.summary.completionRatePct}%` }}
									/>
								</div>
							</div>
						)}
					</div>

					{byProgram.length > 0 && (
						<div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
							<div className="bg-zinc-700 px-4 py-2">
								<p className="text-xs font-bold text-white uppercase tracking-wide">
									Encuestas en curso por carrera
								</p>
							</div>
							<div className="divide-y divide-zinc-100">
								{byProgram.map((row, i) => {
									const name = toText(row.programName);
									const rate = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
									return (
										<div key={i} className="px-4 py-3 space-y-1">
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium text-zinc-800 truncate">
													{name || row.programCode || `Carrera ${i + 1}`}
												</span>
												<span className="text-xs text-zinc-500 shrink-0 ml-3">
													{row.completed}/{row.total}
												</span>
											</div>
											<div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
												<div
													className={`h-1.5 rounded-full transition-all duration-500 ${
														rate === 100
															? 'bg-green-500'
															: rate >= 50
																? 'bg-amber-400'
																: 'bg-red-400'
													}`}
													style={{ width: `${rate}%` }}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{reportData.outcomes && reportData.outcomes.length > 0 && (
						<div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200">
							<p className="text-xs font-bold text-zinc-600 mb-2">Outcomes</p>
							<ul className="space-y-1">
								{reportData.outcomes.map((o) => (
									<li key={o.outcomeId} className="flex items-center justify-between text-xs">
										<span className="text-zinc-700 truncate max-w-xs">{o.outcomeName}</span>
										<span className="font-semibold ml-2">{o.averageScore.toFixed(2)}</span>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			)}

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
