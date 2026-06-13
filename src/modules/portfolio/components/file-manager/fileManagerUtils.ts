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

/** Root prefix for all portfolio objects in S3. Every key/prefix must be scoped under it. */
export const PORTFOLIO_ROOT_PREFIX = 'portfolio/';

/** Builds breadcrumb segments from an S3 prefix (`portfolio/EPE/2023/` → root, EPE, 2023). */
export function buildBreadcrumbs(prefix: string, rootLabel: string): BreadcrumbSegment[] {
	const segments: BreadcrumbSegment[] = [{ name: rootLabel, prefix: PORTFOLIO_ROOT_PREFIX }];
	const relative = prefix.startsWith(PORTFOLIO_ROOT_PREFIX)
		? prefix.slice(PORTFOLIO_ROOT_PREFIX.length)
		: prefix;
	const parts = relative.split('/').filter(Boolean);
	let acc = PORTFOLIO_ROOT_PREFIX;
	for (const part of parts) {
		acc += `${part}/`;
		segments.push({ name: part, prefix: acc });
	}
	return segments;
}
