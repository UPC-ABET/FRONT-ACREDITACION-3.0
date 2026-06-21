'use client';

import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { S3Entry } from '../../types';
import { FileManagerTable } from './FileManagerTable';

type Props = {
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	entries: S3Entry[];
	search: string;
	selectedKeys: Set<string>;
	onToggleSelect: (key: string) => void;
	onToggleAll: () => void;
	onOpenFolder: (entry: S3Entry) => void;
	onDownload: (entry: S3Entry) => void;
	onDeleteOne: (entry: S3Entry) => void;
	downloadingKey: string | null;
};

export function FileManagerBody({
	isLoading,
	isError,
	error,
	entries,
	search,
	selectedKeys,
	onToggleSelect,
	onToggleAll,
	onOpenFolder,
	onDownload,
	onDeleteOne,
	downloadingKey,
}: Props) {
	const { t } = useI18n();

	if (isLoading) {
		return (
			<div className="space-y-2">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={`fm-sk-${i}`} className="h-11 w-full rounded-lg" />
				))}
			</div>
		);
	}
	if (isError) {
		return (
			<p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
				{t(getErrorMessage(error, 'portfolio.error.loadFailed'))}
			</p>
		);
	}
	if (entries.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 py-16 text-center">
				<CloudArrowUpIcon className="mb-3 h-12 w-12 text-zinc-300" />
				<p className="text-sm font-medium text-zinc-500">
					{search.trim() ? t('portfolio.table.noResults') : t('portfolio.table.empty')}
				</p>
			</div>
		);
	}
	return (
		<FileManagerTable
			entries={entries}
			selectedKeys={selectedKeys}
			onToggleSelect={onToggleSelect}
			onToggleAll={onToggleAll}
			onOpenFolder={onOpenFolder}
			onDownload={onDownload}
			onDeleteOne={onDeleteOne}
			downloadingKey={downloadingKey}
		/>
	);
}
