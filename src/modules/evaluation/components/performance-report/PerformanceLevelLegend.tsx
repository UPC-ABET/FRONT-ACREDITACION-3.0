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

function trimScore(score: number): string {
	return String(Math.round(score * 100) / 100);
}

// Levels are stored as closed ranges whose upper bound stops just short of the next one
// ([0, 12.999999], [13, 15.999999], …). Printing maxScore verbatim would show "12.999999",
// so every level but the last borrows the next level's minScore and renders half-open.
function formatLevelRange(legend: PerformanceLevelLegendDto[], index: number): string {
	const isLast = index === legend.length - 1;
	const lower = trimScore(legend[index].minScore);
	const upper = trimScore(isLast ? legend[index].maxScore : legend[index + 1].minScore);
	return isLast ? `[${lower} - ${upper}]` : `[${lower} - ${upper}>`;
}

export function PerformanceLevelLegend({ legend }: PerformanceLevelLegendProps) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
			{legend.map((level, index) => (
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
						<p className="text-xs text-zinc-500 tabular-nums">{formatLevelRange(legend, index)}</p>
					</div>
				</div>
			))}
		</div>
	);
}
