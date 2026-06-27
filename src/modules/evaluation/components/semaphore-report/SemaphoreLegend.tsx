'use client';

import type { SemaphoreLevelLegendDto } from '../../types';

interface SemaphoreLegendProps {
	readonly legend: SemaphoreLevelLegendDto[];
}

function tint(hex: string, alphaHex: string): string {
	const clean = hex.trim();
	if (/^#[0-9a-fA-F]{6}$/.test(clean)) return `${clean}${alphaHex}`;
	return clean;
}

export function SemaphoreLegend({ legend }: SemaphoreLegendProps) {
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
							[{level.minScore} - {level.maxScore}]
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
