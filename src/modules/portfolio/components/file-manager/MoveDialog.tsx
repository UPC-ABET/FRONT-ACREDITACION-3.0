'use client';

import { useMemo, useState } from 'react';
import { ChevronRightIcon, FolderIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Skeleton,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import type { S3Entry } from '../../types';
import { usePortfolioFiles } from '../../hooks';
import { buildBreadcrumbs } from './fileManagerUtils';
import { FileBreadcrumbs } from './FileBreadcrumbs';

type Props = {
	isOpen: boolean;
	sources: S3Entry[];
	startPrefix: string;
	onClose: () => void;
	onConfirm: (destPrefix: string) => void;
	isLoading?: boolean;
};

// Remounted via `key` by the parent each time it opens, so navigation starts fresh.
export function MoveDialog({ isOpen, sources, startPrefix, onClose, onConfirm, isLoading }: Props) {
	const { t } = useI18n();
	const [prefix, setPrefix] = useState(startPrefix);

	const sourceKeys = useMemo(() => new Set(sources.map((s) => s.key)), [sources]);
	const { data, isLoading: loadingFolders } = usePortfolioFiles(prefix);
	const breadcrumbs = useMemo(
		() => buildBreadcrumbs(prefix, t('portfolio.breadcrumb.root')),
		[prefix, t],
	);

	// Folders the user can descend into — never a folder that is being moved.
	const folders = (data?.folders ?? []).filter((f) => !sourceKeys.has(f.key));

	const movingLabel =
		sources.length === 1
			? sources[0].name
			: t('portfolio.move.countSelected').replace('{{count}}', String(sources.length));

	// Disable confirm when the destination is the current location of the sources.
	const sameLocation = sources.some((s) => {
		const trimmed = s.key.endsWith('/') ? s.key.slice(0, -1) : s.key;
		const parent = trimmed.includes('/') ? `${trimmed.slice(0, trimmed.lastIndexOf('/'))}/` : '';
		return parent === prefix;
	});

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}>
			<DialogContent showCloseButton={false} className="max-w-lg">
				<DialogHeader className="gap-1">
					<DialogTitle>{t('portfolio.move.title')}</DialogTitle>
					<p className="text-sm text-zinc-500">
						{t('portfolio.move.moving').replace('{{name}}', movingLabel)}
					</p>
				</DialogHeader>

				<div className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2">
					<FileBreadcrumbs segments={breadcrumbs} onNavigate={setPrefix} />
				</div>

				<div className="mt-3 max-h-72 min-h-32 overflow-y-auto rounded-lg border border-zinc-200">
					{loadingFolders ? (
						<div className="space-y-2 p-3">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={`mv-sk-${i}`} className="h-8 w-full rounded-md" />
							))}
						</div>
					) : folders.length === 0 ? (
						<p className="px-4 py-8 text-center text-sm text-zinc-400">
							{t('portfolio.move.noFolders')}
						</p>
					) : (
						<ul className="divide-y divide-zinc-100">
							{folders.map((folder) => (
								<li key={folder.key}>
									<button
										type="button"
										onClick={() => setPrefix(folder.key)}
										className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-red-600">
										<FolderIcon className="h-5 w-5 shrink-0 text-amber-500" />
										<span className="truncate">{folder.name}</span>
										<ChevronRightIcon className="ml-auto h-4 w-4 text-zinc-300" />
									</button>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button variant="secondary" onClick={onClose} disabled={isLoading}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button
						variant="primary"
						onClick={() => onConfirm(prefix)}
						disabled={isLoading || sameLocation}>
						{isLoading ? t('portfolio.move.moving_progress') : t('portfolio.move.confirmHere')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
