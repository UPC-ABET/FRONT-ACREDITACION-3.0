'use client';

import { NODE_HEIGHT, NODE_WIDTH, accentForEntityType } from '../constants';
import type { ChartNode, I18nText } from '../types';
import type { PositionedNode } from '../utils/layout';

interface OrgChartNodeProps {
	positioned: PositionedNode;
	isHovered: boolean;
	isSelected: boolean;
	locale: string;
	exporting: boolean;
	onHover: (chartId: number | null) => void;
	onSelect: (node: ChartNode, clientX: number, clientY: number) => void;
	onToggle: (chartId: number) => void;
}

const FONT_FAMILY = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
const CONTENT_LEFT = 24;
const CONTENT_RIGHT = NODE_WIDTH - 16;

function localized(text: I18nText | undefined | null, locale: string): string {
	if (!text) return '';
	return text[locale as 'es' | 'en'] ?? text.es ?? text.en ?? '';
}

function truncate(value: string, maxChars: number): string {
	if (value.length <= maxChars) return value;
	return `${value.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function OrgChartNode({
	positioned,
	isHovered,
	isSelected,
	locale,
	exporting,
	onHover,
	onSelect,
	onToggle,
}: OrgChartNodeProps) {
	const { node, x, y, hasChildren, collapsed } = positioned;
	const accent = accentForEntityType(node.entityType?.code);

	const roleTitle = localized(node.organizationLevelTitle, locale);
	const fullName = `${node.firstName} ${node.lastName}`.trim();
	const staffTitle = localized(node.staffTitle, locale);
	const entityTypeName = node.entityType ? localized(node.entityType.name, locale) : '';
	const entityLabel = node.entity
		? `${node.entity.code} · ${localized(node.entity.name, locale)}`
		: '';

	const strokeColor = isSelected ? accent : isHovered ? '#a1a1aa' : '#e4e4e7';
	const strokeWidth = isSelected ? 2 : 1;

	const badgeWidth = entityTypeName ? Math.min(150, entityTypeName.length * 6.4 + 18) : 0;
	const professorChipWidth = node.professorCode ? node.professorCode.length * 6.6 + 16 : 0;

	return (
		<g
			transform={`translate(${x} ${y})`}
			className="cursor-pointer"
			role="button"
			aria-label={`${roleTitle} — ${fullName}`}
			onMouseEnter={() => onHover(node.chartId)}
			onMouseLeave={() => onHover(null)}
			onClick={(event) => onSelect(node, event.clientX, event.clientY)}>
			<rect
				width={NODE_WIDTH}
				height={NODE_HEIGHT}
				rx={14}
				fill="#ffffff"
				stroke={strokeColor}
				strokeWidth={strokeWidth}
				filter={exporting ? undefined : 'url(#nodeShadow)'}
			/>

			<rect x={10} y={14} width={4} height={NODE_HEIGHT - 28} rx={2} fill={accent} />

			<text
				x={CONTENT_LEFT}
				y={30}
				fontFamily={FONT_FAMILY}
				fontSize={13.5}
				fontWeight={700}
				fill="#111827">
				{truncate(roleTitle, node.professorCode ? 26 : 32)}
			</text>

			{node.professorCode && (
				<g transform={`translate(${CONTENT_RIGHT - professorChipWidth} 14)`}>
					<rect width={professorChipWidth} height={18} rx={9} fill="#f4f4f5" />
					<text
						x={professorChipWidth / 2}
						y={13}
						textAnchor="middle"
						fontFamily={FONT_FAMILY}
						fontSize={10}
						fontWeight={600}
						fill="#3f3f46">
						{node.professorCode}
					</text>
				</g>
			)}

			<text x={CONTENT_LEFT} y={50} fontFamily={FONT_FAMILY} fontSize={12.5} fill="#3f3f46">
				{truncate(fullName, 34)}
			</text>

			{staffTitle && (
				<text
					x={CONTENT_LEFT}
					y={68}
					fontFamily={FONT_FAMILY}
					fontSize={11}
					fontStyle="italic"
					fill="#71717a">
					{truncate(staffTitle, 38)}
				</text>
			)}

			{entityTypeName && (
				<g transform={`translate(${CONTENT_LEFT} 82)`}>
					<rect width={badgeWidth} height={18} rx={9} fill={accent} fillOpacity={0.12} />
					<text
						x={badgeWidth / 2}
						y={13}
						textAnchor="middle"
						fontFamily={FONT_FAMILY}
						fontSize={10}
						fontWeight={600}
						fill={accent}>
						{truncate(entityTypeName, 20)}
					</text>
				</g>
			)}

			{entityLabel && (
				<text x={CONTENT_LEFT} y={112} fontFamily={FONT_FAMILY} fontSize={11} fill="#52525b">
					{truncate(entityLabel, 38)}
				</text>
			)}

			{hasChildren && !exporting && (
				<g
					transform={`translate(${NODE_WIDTH / 2} ${NODE_HEIGHT})`}
					className="cursor-pointer"
					role="button"
					aria-label={collapsed ? 'expand' : 'collapse'}
					onClick={(event) => {
						event.stopPropagation();
						onToggle(node.chartId);
					}}>
					<circle r={11} fill="#ffffff" stroke="#d4d4d8" strokeWidth={1} />
					<line
						x1={-5}
						y1={0}
						x2={5}
						y2={0}
						stroke="#3f3f46"
						strokeWidth={1.5}
						strokeLinecap="round"
					/>
					{collapsed && (
						<line
							x1={0}
							y1={-5}
							x2={0}
							y2={5}
							stroke="#3f3f46"
							strokeWidth={1.5}
							strokeLinecap="round"
						/>
					)}
				</g>
			)}
		</g>
	);
}
