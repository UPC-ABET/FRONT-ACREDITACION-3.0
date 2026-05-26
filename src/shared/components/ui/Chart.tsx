'use client';

import * as React from 'react';
import { ResponsiveContainer, Tooltip, Legend } from 'recharts';

type TooltipEntry = {
	name?: string;
	value?: string | number;
	color?: string;
	fill?: string;
};

export type ChartConfig = {
	[key: string]: {
		label?: React.ReactNode;
		icon?: React.ComponentType;
		color?: string;
	};
};

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

// --- Contenedor Principal ---
export function ChartContainer({
	config,
	children,
	className,
}: {
	config: ChartConfig;
	children: React.ReactElement;
	className?: string;
}) {
	const cssVars = React.useMemo(() => {
		const vars: Record<string, string> = {};
		for (const [key, value] of Object.entries(config)) {
			if (value.color) vars[`--color-${key}`] = value.color;
		}
		return vars;
	}, [config]);

	const [isMounted, setIsMounted] = React.useState(false);

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	return (
		<ChartContext.Provider value={{ config }}>
			<div className={`w-full ${className}`} style={cssVars}>
				{isMounted ? (
					<ResponsiveContainer width="100%" height="100%">
						{children}
					</ResponsiveContainer>
				) : (
					<div className="h-full w-full" />
				)}
			</div>
		</ChartContext.Provider>
	);
}

export function ChartTooltipContent({
	active,
	payload,
	label,
}: {
	active?: boolean;
	payload?: TooltipEntry[];
	label?: string;
}) {
	if (!active || !payload) return null;

	return (
		<div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-md">
			<p className="mb-2 text-xs font-bold text-zinc-500 uppercase">{label}</p>
			<div className="space-y-1.5">
				{payload.map((item, index) => (
					<div key={index} className="flex items-center gap-2">
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: item.fill || item.color }}
						/>
						<span className="text-sm font-medium text-zinc-800">{item.name}:</span>
						<span className="text-sm font-bold text-zinc-900 ml-auto">{item.value}</span>
					</div>
				))}
			</div>
		</div>
	);
}

export function ChartLegendContent({
	payload,
}: {
	payload?: Array<{ color?: string; value: string }>;
}) {
	if (!payload) return null;

	return (
		<div className="flex flex-wrap items-center justify-center gap-6 mt-4">
			{payload.map((entry, index) => (
				<div key={index} className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
					<span className="text-xs font-medium text-zinc-600">{entry.value}</span>
				</div>
			))}
		</div>
	);
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;
