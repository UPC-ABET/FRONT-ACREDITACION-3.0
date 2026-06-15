'use client';

import React, { useEffect, useState } from 'react';
import { Button, Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { usePPPReports } from '../../hooks';

interface PPPReportsProps {
	readonly programId: number;
}

export function PPPReports({ programId }: PPPReportsProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { loading, error, reportData, generate } = usePPPReports();

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		if (error) setToast({ open: true, type: 'error', msg: error });
	}, [error]);

	async function handleGenerate() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		await generate({ academicPeriodId, programId: programId || undefined });
	}

	if (!academicPeriodId) {
		return (
			<p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>
		);
	}

	return (
		<div className="max-w-lg space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">{t('surveys.ppp.reports.title')}</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.reports.description')}</p>
			</div>

			<div className="space-y-4">
				<Button onClick={handleGenerate} disabled={loading} loading={loading}>
					{t('surveys.shared.generateDashboard')}
				</Button>
			</div>

			{reportData && (
				<div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
					<p className="text-sm font-bold text-zinc-700">{t('surveys.shared.summary')}</p>
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<span className="text-xs text-zinc-500 block">
								{t('surveys.shared.totalSurveys')}
							</span>
							<span className="font-semibold">{reportData.summary?.totalSurveys ?? '—'}</span>
						</div>
						{reportData.summary?.completionRatePct !== undefined && (
							<div>
								<span className="text-xs text-zinc-500 block">
									{t('surveys.shared.completionRate')}
								</span>
								<span className="font-semibold">{reportData.summary.completionRatePct}%</span>
							</div>
						)}
						{reportData.summary?.green !== undefined && (
							<div>
								<span className="text-xs text-zinc-500 block">
									{t('surveys.shared.colorSummary')}
								</span>
								<span className="font-semibold">
									{reportData.summary.green} / {reportData.summary.yellow} /{' '}
									{reportData.summary.red}
								</span>
							</div>
						)}
					</div>
					{reportData.outcomes && reportData.outcomes.length > 0 && (
						<div className="mt-3">
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
