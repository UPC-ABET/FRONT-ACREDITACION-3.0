'use client';

import { type RefObject, useMemo } from 'react';
import { CANVAS_PADDING } from '../constants';
import type { ChartNode } from '../types';
import { layoutChart } from '../utils/layout';
import { OrgChartNode } from './OrgChartNode';

interface OrgChartProps {
	root: ChartNode;
	collapsed: Set<number>;
	scale: number;
	hoveredId: number | null;
	selectedId: number | null;
	exporting: boolean;
	svgRef: RefObject<SVGSVGElement | null>;
	onHover: (chartId: number | null) => void;
	onSelect: (node: ChartNode, clientX: number, clientY: number) => void;
	onToggle: (chartId: number) => void;
	locale: string;
}

export function OrgChart({
	root,
	collapsed,
	scale,
	hoveredId,
	selectedId,
	exporting,
	svgRef,
	onHover,
	onSelect,
	onToggle,
	locale,
}: OrgChartProps) {
	const layout = useMemo(() => layoutChart(root, collapsed), [root, collapsed]);

	const viewWidth = layout.width + CANVAS_PADDING * 2;
	const viewHeight = layout.height + CANVAS_PADDING * 2;

	return (
		<svg
			ref={svgRef}
			width={viewWidth * scale}
			height={viewHeight * scale}
			viewBox={`0 0 ${viewWidth} ${viewHeight}`}
			role="tree"
			style={{ display: 'block' }}>
			<defs>
				<filter id="nodeShadow" x="-10%" y="-10%" width="120%" height="130%">
					<feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.10" />
				</filter>
			</defs>

			<rect width={viewWidth} height={viewHeight} fill="#fafafa" />

			<g transform={`translate(${CANVAS_PADDING} ${CANVAS_PADDING})`}>
				{layout.edges.map((edge) => (
					<path key={edge.id} d={edge.d} fill="none" stroke="#cbd5e1" strokeWidth={1.5} />
				))}

				{layout.nodes.map((positioned) => (
					<OrgChartNode
						key={positioned.node.chartId}
						positioned={positioned}
						isHovered={hoveredId === positioned.node.chartId}
						isSelected={selectedId === positioned.node.chartId}
						locale={locale}
						exporting={exporting}
						onHover={onHover}
						onSelect={onSelect}
						onToggle={onToggle}
					/>
				))}
			</g>
		</svg>
	);
}
