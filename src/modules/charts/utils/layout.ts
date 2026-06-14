import {
	NODE_HEIGHT,
	NODE_HORIZONTAL_GAP,
	NODE_VERTICAL_GAP,
	NODE_WIDTH,
	STACK_INDENT,
	STACK_VERTICAL_GAP,
} from '../constants';
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
	d: string;
}

export interface ChartLayout {
	nodes: PositionedNode[];
	edges: ChartEdge[];
	width: number;
	height: number;
}

function isLeafNode(node: ChartNode): boolean {
	return !node.children || node.children.length === 0;
}

export function layoutChart(root: ChartNode, collapsed: Set<number>): ChartLayout {
	const nodes: PositionedNode[] = [];
	const edges: ChartEdge[] = [];
	let cursorX = 0;

	function walk(node: ChartNode, depth: number, top: number): number {
		const isCollapsed = collapsed.has(node.chartId);
		const hasChildren = Boolean(node.children && node.children.length > 0);
		const childNodes = !isCollapsed && hasChildren ? node.children : [];

		if (childNodes.length === 0) {
			const left = cursorX;
			cursorX += NODE_WIDTH + NODE_HORIZONTAL_GAP;
			nodes.push({ node, x: left, y: top, depth, hasChildren, collapsed: isCollapsed });
			return left;
		}

		const stackVertically = childNodes.length > 1 && childNodes.every(isLeafNode);

		if (stackVertically) {
			const left = cursorX;
			const childLeft = left + STACK_INDENT;
			const trunkX = left + STACK_INDENT / 2;
			let childTop = top + NODE_HEIGHT + NODE_VERTICAL_GAP;

			childNodes.forEach((child) => {
				const childCenterY = childTop + NODE_HEIGHT / 2;
				nodes.push({
					node: child,
					x: childLeft,
					y: childTop,
					depth: depth + 1,
					hasChildren: false,
					collapsed: false,
				});
				edges.push({
					id: `${node.chartId}-${child.chartId}`,
					d: `M ${trunkX} ${top + NODE_HEIGHT} L ${trunkX} ${childCenterY} L ${childLeft} ${childCenterY}`,
				});
				childTop += NODE_HEIGHT + STACK_VERTICAL_GAP;
			});

			cursorX = left + STACK_INDENT + NODE_WIDTH + NODE_HORIZONTAL_GAP;
			nodes.push({ node, x: left, y: top, depth, hasChildren, collapsed: isCollapsed });
			return left;
		}

		const childTop = top + NODE_HEIGHT + NODE_VERTICAL_GAP;
		const childLefts = childNodes.map((child) => walk(child, depth + 1, childTop));
		const left = (childLefts[0] + childLefts[childLefts.length - 1]) / 2;

		const parentCenterX = left + NODE_WIDTH / 2;
		const parentBottomY = top + NODE_HEIGHT;
		const midY = parentBottomY + NODE_VERTICAL_GAP / 2;

		childNodes.forEach((child, index) => {
			const childCenterX = childLefts[index] + NODE_WIDTH / 2;
			edges.push({
				id: `${node.chartId}-${child.chartId}`,
				d: `M ${parentCenterX} ${parentBottomY} L ${parentCenterX} ${midY} L ${childCenterX} ${midY} L ${childCenterX} ${childTop}`,
			});
		});

		nodes.push({ node, x: left, y: top, depth, hasChildren, collapsed: isCollapsed });
		return left;
	}

	walk(root, 0, 0);

	const width = nodes.reduce((max, positioned) => Math.max(max, positioned.x + NODE_WIDTH), 0);
	const height = nodes.reduce((max, positioned) => Math.max(max, positioned.y + NODE_HEIGHT), 0);

	return { nodes, edges, width, height };
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
