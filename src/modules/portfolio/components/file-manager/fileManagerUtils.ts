import {
	DocumentIcon,
	DocumentTextIcon,
	PhotoIcon,
	TableCellsIcon,
	FilmIcon,
	ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import type { BreadcrumbSegment } from '../../types';

export function formatBytes(bytes: number): string {
	if (!bytes) return '—';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDate(iso: string | null): string {
	if (!iso) return '—';
	return new Intl.DateTimeFormat(undefined, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(iso));
}

export function getFileIcon(name: string): React.ComponentType<React.SVGProps<SVGSVGElement>> {
	const ext = name.split('.').pop()?.toLowerCase() ?? '';
	if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return PhotoIcon;
	if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return DocumentTextIcon;
	if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return TableCellsIcon;
	if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return FilmIcon;
	if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return ArchiveBoxIcon;
	return DocumentIcon;
}

export type TreeNode = {
	name: string;
	/** Full S3 key (folders end with `/`). */
	key: string;
	isFolder: boolean;
	children: TreeNode[];
};

/** Builds a nested folder/file tree from a flat list of S3 keys. */
export function buildTree(keys: string[]): TreeNode[] {
	const root: TreeNode[] = [];

	for (const key of keys) {
		const parts = key.split('/').filter(Boolean);
		const endsWithSlash = key.endsWith('/');
		let level = root;
		let acc = '';

		for (let i = 0; i < parts.length; i++) {
			const name = parts[i];
			const isFile = !endsWithSlash && i === parts.length - 1;
			acc += isFile ? name : `${name}/`;

			let node = level.find((n) => n.name === name && n.isFolder !== isFile);
			if (!node) {
				node = { name, key: acc, isFolder: !isFile, children: [] };
				level.push(node);
			}
			if (isFile) break;
			level = node.children;
		}
	}

	const sortNodes = (nodes: TreeNode[]) => {
		nodes.sort((a, b) => {
			if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
		nodes.forEach((n) => sortNodes(n.children));
	};
	sortNodes(root);
	return root;
}

/** Renders a tree as an indented monospace string (for printing). */
export function treeToText(nodes: TreeNode[], depth = 0): string {
	let out = '';
	for (const node of nodes) {
		out += `${'    '.repeat(depth)}${node.isFolder ? '📁' : '📄'} ${node.name}\n`;
		if (node.children.length > 0) out += treeToText(node.children, depth + 1);
	}
	return out;
}

/** Builds breadcrumb segments from an S3 prefix (`EPE/2023/` → root, EPE, 2023). */
export function buildBreadcrumbs(prefix: string, rootLabel: string): BreadcrumbSegment[] {
	const segments: BreadcrumbSegment[] = [{ name: rootLabel, prefix: '' }];
	const parts = prefix.split('/').filter(Boolean);
	let acc = '';
	for (const part of parts) {
		acc += `${part}/`;
		segments.push({ name: part, prefix: acc });
	}
	return segments;
}
