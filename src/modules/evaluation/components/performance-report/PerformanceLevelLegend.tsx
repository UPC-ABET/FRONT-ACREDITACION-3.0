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
// ([0, 12.999999], [13, 15.999999], …). Printing maxScore verbatim would show "12.999999", so
// the outer bound of the lowest/highest level borrows its neighbor's clean minScore/maxScore.
//
// Only the two outer levels are half-open, on the side that faces the rest of the scale --
// `[0 - 13>` for the lowest, `<16 - 20]` for the highest -- because that shared boundary belongs
// to whichever level sits between them. Every level in between (and a lone level with no
// neighbors) is closed on both ends, e.g. `[13 - 16]`. Mirrors the backend's
// `formatLevelRange` in semaphore-reports.service.ts.
function formatLevelRange(legend: PerformanceLevelLegendDto[], index: number): string {
	const hasNeighbors = legend.length > 1;
	const isFirst = index === 0;
	const isLast = index === legend.length - 1;
	const lowerValue = isLast && hasNeighbors ? legend[index - 1].maxScore : legend[index].minScore;
	const upperValue = isFirst && hasNeighbors ? legend[index + 1].minScore : legend[index].maxScore;
	const lower = trimScore(lowerValue);
	const upper = trimScore(upperValue);
	const openLeft = isLast && hasNeighbors ? '<' : '[';
	const openRight = isFirst && hasNeighbors ? '>' : ']';
	return `${openLeft}${lower} - ${upper}${openRight}`;
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
