'use client';

import type { PerformanceLevelLegendDto } from '@/modules';

interface PerformanceLevelLegendProps {
	readonly legend: PerformanceLevelLegendDto[];
}

function tint(hex: string, alphaHex: string): string {
	const clean = hex.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(clean)) return `${clean}${alphaHex}`;
	return clean;
}

// Always 1 decimal, truncated (not rounded) -- a stored boundary like 15.999999 must read as
// "15.9", never "16.0": rounding up would claim a score of 15.95 already qualifies for the next
// level, which the actual stored boundary does not allow.
function formatScore(value: number): string {
	return (Math.trunc(value * 10) / 10).toFixed(1);
}

export function PerformanceLevelLegend({ legend }: PerformanceLevelLegendProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{legend.map((level) => (
				<div
					key={level.name}
					className="flex items-center gap-4 rounded-xl border p-5 shadow-sm"
					style={{
						backgroundColor: tint(level.color, '1A'),
						borderColor: tint(level.color, '33'),
					}}>
					<span
						className="h-3 w-3 shrink-0 rounded-full"
						style={{ backgroundColor: level.color }}
						aria-hidden="true"
					/>
					<div>
						<p className="text-sm font-medium text-zinc-700">{level.name}</p>
						<p className="text-xs text-zinc-500 tabular-nums">
							[{formatScore(level.minScore)} - {formatScore(level.maxScore)}]
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
