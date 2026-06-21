'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import type { BreadcrumbSegment } from '../../types';
import { FileBreadcrumbs } from './FileBreadcrumbs';

type Props = {
	segments: BreadcrumbSegment[];
	onNavigate: (prefix: string) => void;
	onRefresh: () => void;
	isFetching: boolean;
};

export function FileManagerHeader({ segments, onNavigate, onRefresh, isFetching }: Props) {
	const { t } = useI18n();

	return (
		<div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2">
			<FileBreadcrumbs segments={segments} onNavigate={onNavigate} />
			<button
				type="button"
				onClick={onRefresh}
				className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
				title={t('portfolio.toolbar.refresh')}
				aria-label={t('portfolio.toolbar.refresh')}>
				<ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
			</button>
		</div>
	);
}
