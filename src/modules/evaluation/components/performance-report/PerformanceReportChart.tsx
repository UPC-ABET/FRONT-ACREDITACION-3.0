'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from '@/shared/components';
import { useI18n } from '@/providers';
import type { PerformanceReportDto } from '@/modules';

interface PerformanceReportChartProps {
	readonly report: PerformanceReportDto;
}

type ChartRow = { outcome: string } & Record<string, number | string>;

// Aggregate summary rows by outcome and count students per performance level. Series are keyed
// level0/level1/... so the chart works with any number of levels (matches the PDF chart).
function buildChartData(report: PerformanceReportDto): ChartRow[] {
	const byOutcome = new Map<string, ChartRow>();
	for (const row of report.summary) {
		const current = byOutcome.get(row.outcomeCode) ?? { outcome: row.outcomeCode };
		const counts = [row.studentsRed, row.studentsYellow, row.studentsGreen];
		report.legend.forEach((_, index) => {
			const key = `level${index}`;
			current[key] = ((current[key] as number | undefined) ?? 0) + (counts[index] ?? 0);
		});
		byOutcome.set(row.outcomeCode, current);
	}
	return [...byOutcome.values()].sort((a, b) =>
		String(a.outcome).localeCompare(String(b.outcome), undefined, { numeric: true }),
	);
}

export function PerformanceReportChart({ report }: PerformanceReportChartProps) {
	const { t } = useI18n();
	const data = useMemo(() => buildChartData(report), [report]);

	const config = useMemo(
		() =>
			Object.fromEntries(
				report.legend.map((level, index) => [
					`level${index}`,
					{ label: level.name, color: level.color },
				]),
			),
		[report.legend],
	);

	if (data.length === 0 || report.legend.length === 0) return null;

	return (
		<div className="space-y-3">
			<h3 className="text-sm font-semibold text-zinc-700">{t('performanceReports.chart.title')}</h3>
			<ChartContainer config={config} className="h-80">
				<BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
					<CartesianGrid vertical={false} strokeDasharray="3 3" />
					<XAxis dataKey="outcome" tickLine={false} axisLine={false} fontSize={12} />
					<YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={32} />
					<ChartTooltip content={<ChartTooltipContent />} />
					<ChartLegend content={<ChartLegendContent />} />
					{report.legend.map((level, index) => (
						<Bar
							key={level.name}
							dataKey={`level${index}`}
							name={level.name}
							fill={level.color}
							radius={[4, 4, 0, 0]}
							maxBarSize={48}
						/>
					))}
				</BarChart>
			</ChartContainer>
		</div>
	);
}
