'use client';

import { type RefObject } from 'react';
import {
	ArrowDownTrayIcon,
	ArrowUpTrayIcon,
	ClipboardDocumentIcon,
	ClipboardIcon,
	DocumentPlusIcon,
	FolderPlusIcon,
	ListBulletIcon,
	MagnifyingGlassIcon,
	PencilSquareIcon,
	TrashIcon,
	TruckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/shared/components/ui';
import { useI18n } from '@/providers';

type Props = {
	fileInputRef: RefObject<HTMLInputElement | null>;
	isUploading: boolean;
	uploadProgress: { done: number; total: number } | null;
	clipboardCount: number;
	selectedCount: number;
	search: string;
	onSearchChange: (value: string) => void;
	onNewFolder: () => void;
	onNewComment: () => void;
	onOpenTree: () => void;
	onInputUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onPaste: () => void;
	onCopy: () => void;
	onRename: () => void;
	onMove: () => void;
	onDownloadSelected: () => void;
	onDeleteSelected: () => void;
};

export function FileManagerToolbar({
	fileInputRef,
	isUploading,
	uploadProgress,
	clipboardCount,
	selectedCount,
	search,
	onSearchChange,
	onNewFolder,
	onNewComment,
	onOpenTree,
	onInputUpload,
	onPaste,
	onCopy,
	onRename,
	onMove,
	onDownloadSelected,
	onDeleteSelected,
}: Props) {
	const { t } = useI18n();

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Button variant="primary" size="md" onClick={onNewFolder}>
				<FolderPlusIcon className="h-5 w-5" />
				{t('portfolio.toolbar.newFolder')}
			</Button>
			<Button variant="secondary" size="md" onClick={onNewComment}>
				<DocumentPlusIcon className="h-5 w-5" />
				{t('portfolio.toolbar.newComment')}
			</Button>
			<Button
				variant="secondary"
				size="md"
				disabled={isUploading}
				onClick={() => fileInputRef.current?.click()}>
				<ArrowUpTrayIcon className="h-5 w-5" />
				{uploadProgress
					? `${t('portfolio.dropzone.uploading')} ${uploadProgress.done}/${uploadProgress.total}`
					: t('portfolio.toolbar.upload')}
			</Button>
			<Button variant="surface" size="md" onClick={onOpenTree}>
				<ListBulletIcon className="h-5 w-5" />
				{t('portfolio.toolbar.tree')}
			</Button>
			<input ref={fileInputRef} type="file" multiple className="hidden" onChange={onInputUpload} />
			{clipboardCount > 0 && (
				<Button variant="surface" size="md" onClick={onPaste}>
					<ClipboardIcon className="h-5 w-5" />
					{t('portfolio.toolbar.paste')} ({clipboardCount})
				</Button>
			)}
			{selectedCount > 0 && (
				<>
					<Button variant="surface" size="md" onClick={onCopy}>
						<ClipboardDocumentIcon className="h-5 w-5" />
						{t('portfolio.toolbar.copy')} ({selectedCount})
					</Button>
					{selectedCount === 1 && (
						<Button variant="surface" size="md" onClick={onRename}>
							<PencilSquareIcon className="h-5 w-5" />
							{t('portfolio.toolbar.rename')}
						</Button>
					)}
					<Button variant="surface" size="md" onClick={onMove}>
						<TruckIcon className="h-5 w-5" />
						{t('portfolio.toolbar.move')} ({selectedCount})
					</Button>
					<Button variant="surface" size="md" onClick={onDownloadSelected}>
						<ArrowDownTrayIcon className="h-5 w-5" />
						{t('portfolio.toolbar.download')} ({selectedCount})
					</Button>
					<Button variant="warning" size="md" onClick={onDeleteSelected}>
						<TrashIcon className="h-5 w-5" />
						{t('portfolio.toolbar.delete')} ({selectedCount})
					</Button>
				</>
			)}
			<div className="relative ml-auto w-full sm:w-64">
				<MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
				<input
					type="text"
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					placeholder={t('portfolio.toolbar.searchPlaceholder')}
					className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm placeholder-zinc-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
				/>
			</div>
		</div>
	);
}
