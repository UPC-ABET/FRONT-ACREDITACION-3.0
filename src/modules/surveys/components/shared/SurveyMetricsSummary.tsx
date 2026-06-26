'use client';

import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { Card } from '@/shared/components';
import { useI18n } from '@/providers';
import { cn } from '@/shared/lib/utils';
import type { DashboardSummary } from '../../types';

interface SurveyMetricsSummaryProps {
	summary: DashboardSummary;
}

export function SurveyMetricsSummary({ summary }: SurveyMetricsSummaryProps) {
	const { t } = useI18n();

	return (
		<Card className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
			<MetricBox label={t('surveys.shared.totalSurveys')} value={summary.totalSurveys} />
			<MetricBox
				label={t('surveys.shared.completed')}
				value={summary.completed ?? 0}
				color="text-green-700"
			/>
			<MetricBox
				label={t('surveys.shared.pending')}
				value={summary.pending ?? 0}
				color="text-amber-600"
			/>
			<MetricBox
				label={t('surveys.shared.completionRate')}
				value={`${summary.completionRatePct ?? 0}%`}
				color="text-blue-700"
			/>
		</Card>
	);
}

interface MetricBoxProps {
	label: string;
	value: number | string;
	color?: string;
}

function MetricBox({ label, value, color = 'text-zinc-800' }: MetricBoxProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-1 py-2">
			<ChartBarIcon className="h-5 w-5 text-zinc-400" />
			<span className={cn('text-2xl font-bold', color)}>{value}</span>
			<span className="text-center text-xs text-zinc-500">{label}</span>
		</div>
	);
}
