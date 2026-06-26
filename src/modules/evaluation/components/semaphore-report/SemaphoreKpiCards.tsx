'use client';

import { Card } from '@/shared/components';
import { useI18n } from '@/providers';
import type { SemaphoreColor } from '../../types';

interface SemaphoreKpiCardsProps {
	readonly greenCount: number;
	readonly yellowCount: number;
	readonly redCount: number;
}

const KPI_STYLES: Record<SemaphoreColor, { dot: string; value: string }> = {
	VERDE: { dot: 'bg-emerald-500', value: 'text-emerald-700' },
	AMARILLO: { dot: 'bg-yellow-500', value: 'text-yellow-700' },
	ROJO: { dot: 'bg-red-500', value: 'text-red-700' },
};

export function SemaphoreKpiCards({ greenCount, yellowCount, redCount }: SemaphoreKpiCardsProps) {
	const { t } = useI18n();

	const cards: Array<{ color: SemaphoreColor; label: string; count: number }> = [
		{ color: 'VERDE', label: t('semaphoreReports.kpi.green'), count: greenCount },
		{ color: 'AMARILLO', label: t('semaphoreReports.kpi.yellow'), count: yellowCount },
		{ color: 'ROJO', label: t('semaphoreReports.kpi.red'), count: redCount },
	];

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{cards.map((card) => (
				<Card key={card.color} className="flex items-center gap-4 p-5">
					<span
						className={`h-3 w-3 shrink-0 rounded-full ${KPI_STYLES[card.color].dot}`}
						aria-hidden="true"
					/>
					<div>
						<p className="text-sm font-medium text-zinc-500">{card.label}</p>
						<p className={`text-2xl font-bold ${KPI_STYLES[card.color].value}`}>{card.count}</p>
					</div>
				</Card>
			))}
		</div>
	);
}
