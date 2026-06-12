import { NODE_HEIGHT, NODE_HORIZONTAL_GAP, NODE_VERTICAL_GAP, NODE_WIDTH } from '../constants';
import type { ChartNode } from '../types';

export interface PositionedNode {
	node: ChartNode;
	x: number;
	y: number;
	depth: number;
	hasChildren: boolean;
	collapsed: boolean;
}

export interface ChartEdge {
	id: string;
	parentCenterX: number;
	parentBottomY: number;
	childCenterX: number;
	childTopY: number;
	midY: number;
}

export interface ChartLayout {
	nodes: PositionedNode[];
	edges: ChartEdge[];
	width: number;
	height: number;
}

const rowTop = (depth: number) => depth * (NODE_HEIGHT + NODE_VERTICAL_GAP);

export function layoutChart(root: ChartNode, collapsed: Set<number>): ChartLayout {
	const nodes: PositionedNode[] = [];
	const edges: ChartEdge[] = [];
	let cursorX = 0;

	function walk(node: ChartNode, depth: number): number {
		const y = rowTop(depth);
		const isCollapsed = collapsed.has(node.chartId);
		const hasChildren = Boolean(node.children && node.children.length > 0);
		const childNodes = !isCollapsed && hasChildren ? node.children : [];

		let left: number;
		if (childNodes.length === 0) {
			left = cursorX;
			cursorX += NODE_WIDTH + NODE_HORIZONTAL_GAP;
		} else {
			const childLefts = childNodes.map((child) => walk(child, depth + 1));
			left = (childLefts[0] + childLefts[childLefts.length - 1]) / 2;

			const parentCenterX = left + NODE_WIDTH / 2;
			const parentBottomY = y + NODE_HEIGHT;
			const childTopY = rowTop(depth + 1);
			const midY = parentBottomY + NODE_VERTICAL_GAP / 2;

			childNodes.forEach((child, index) => {
				edges.push({
					id: `${node.chartId}-${child.chartId}`,
					parentCenterX,
					parentBottomY,
					childCenterX: childLefts[index] + NODE_WIDTH / 2,
					childTopY,
					midY,
				});
			});
		}

		nodes.push({ node, x: left, y, depth, hasChildren, collapsed: isCollapsed });
		return left;
	}

	walk(root, 0);

	const maxLeft = nodes.reduce((max, positioned) => Math.max(max, positioned.x), 0);
	const maxDepth = nodes.reduce((max, positioned) => Math.max(max, positioned.depth), 0);

	return {
		nodes,
		edges,
		width: maxLeft + NODE_WIDTH,
		height: maxDepth * (NODE_HEIGHT + NODE_VERTICAL_GAP) + NODE_HEIGHT,
	};
}

export function collectNodeIdsWithChildren(root: ChartNode): number[] {
	const ids: number[] = [];
	const visit = (node: ChartNode) => {
		if (node.children && node.children.length > 0) {
			ids.push(node.chartId);
			node.children.forEach(visit);
		}
	};
	visit(root);
	return ids;
}
