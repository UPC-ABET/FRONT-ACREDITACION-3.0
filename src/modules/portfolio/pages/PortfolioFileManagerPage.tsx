'use client';

import { type DragEvent, useMemo, useRef, useState } from 'react';
import {
	ArrowDownTrayIcon,
	ArrowPathIcon,
	ArrowUpTrayIcon,
	CloudArrowUpIcon,
	FolderPlusIcon,
	MagnifyingGlassIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import {
	Button,
	Card,
	ConfirmDialog,
	Skeleton,
	SuccessDialog,
	Toast,
} from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { S3Entry } from '../types';
import { useCreateFolder, useDeleteEntries, usePortfolioFiles, useUploadFiles } from '../hooks';
import { portfolioS3Service } from '../services';
import {
	buildBreadcrumbs,
	CreateFolderDialog,
	FileBreadcrumbs,
	FileManagerTable,
	PORTFOLIO_ROOT_PREFIX,
} from '../components';

export function PortfolioFileManagerPage() {
	const { t } = useI18n();

	const [prefix, setPrefix] = useState(PORTFOLIO_ROOT_PREFIX);
	const [search, setSearch] = useState('');
	const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
	const [showCreateFolder, setShowCreateFolder] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<S3Entry[] | null>(null);
	const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(
		null,
	);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [toastError, setToastError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);

	const { data, isLoading, isError, error, refetch, isFetching } = usePortfolioFiles(prefix);
	const { mutateAsync: createFolder, isPending: creatingFolder } = useCreateFolder();
	const { mutateAsync: deleteEntries, isPending: deleting } = useDeleteEntries();
	const { mutateAsync: uploadFiles } = useUploadFiles();

	const breadcrumbs = useMemo(
		() => buildBreadcrumbs(prefix, t('portfolio.breadcrumb.root')),
		[prefix, t],
	);

	const entries = useMemo(() => {
		const all: S3Entry[] = [...(data?.folders ?? []), ...(data?.files ?? [])];
		if (!search.trim()) return all;
		const q = search.toLowerCase();
		return all.filter((e) => e.name.toLowerCase().includes(q));
	}, [data, search]);

	function clearSelection() {
		setSelectedKeys(new Set());
	}

	function navigateTo(nextPrefix: string) {
		setPrefix(nextPrefix);
		setSearch('');
		clearSelection();
	}

	function toggleSelect(key: string) {
		setSelectedKeys((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}

	function toggleAll() {
		setSelectedKeys((prev) => {
			if (entries.length > 0 && entries.every((e) => prev.has(e.key))) return new Set();
			return new Set(entries.map((e) => e.key));
		});
	}

	async function handleDownload(entry: S3Entry) {
		setDownloadingKey(entry.key);
		try {
			if (entry.isFolder) await portfolioS3Service.downloadFolder(entry.key, entry.name);
			else await portfolioS3Service.downloadFile(entry.key, entry.name);
		} catch (e) {
			setToastError(getErrorMessage(e, t('portfolio.error.downloadFailed')));
		} finally {
			setDownloadingKey(null);
		}
	}

	async function handleDownloadSelected() {
		const selected = entries.filter((e) => selectedKeys.has(e.key));
		for (const entry of selected) {
			await handleDownload(entry);
		}
	}

	async function handleCreateFolder(name: string) {
		try {
			await createFolder({ prefix, name });
			setShowCreateFolder(false);
			setSuccessMessage(t('portfolio.toast.folderCreated'));
		} catch (e) {
			setShowCreateFolder(false);
			setToastError(getErrorMessage(e, t('portfolio.error.createFolderFailed')));
		}
	}

	async function handleConfirmDelete() {
		if (!confirmDelete) return;
		try {
			await deleteEntries(confirmDelete.map((e) => e.key));
			setConfirmDelete(null);
			clearSelection();
			setSuccessMessage(t('portfolio.toast.deleted'));
		} catch (e) {
			setConfirmDelete(null);
			setToastError(getErrorMessage(e, t('portfolio.error.deleteFailed')));
		}
	}

	async function uploadFileList(files: File[]) {
		if (files.length === 0) return;
		setUploadProgress({ done: 0, total: files.length });
		try {
			await uploadFiles({
				prefix,
				files,
				onProgress: (done, total) => setUploadProgress({ done, total }),
			});
			setSuccessMessage(t('portfolio.toast.uploaded'));
		} catch (e) {
			setToastError(getErrorMessage(e, t('portfolio.error.uploadFailed')));
		} finally {
			setUploadProgress(null);
		}
	}

	function handleInputUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(e.target.files ?? []);
		e.target.value = '';
		void uploadFileList(files);
	}

	function handleDrop(e: DragEvent<HTMLDivElement>) {
		e.preventDefault();
		setIsDragging(false);
		const files = Array.from(e.dataTransfer.files ?? []);
		void uploadFileList(files);
	}

	const selectedCount = selectedKeys.size;
	const isUploading = uploadProgress !== null;

	function renderBody() {
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
					{getErrorMessage(error, t('portfolio.error.loadFailed'))}
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
				onToggleSelect={toggleSelect}
				onToggleAll={toggleAll}
				onOpenFolder={(entry) => navigateTo(entry.key)}
				onDownload={handleDownload}
				onDeleteOne={(entry) => setConfirmDelete([entry])}
				downloadingKey={downloadingKey}
			/>
		);
	}

	return (
		<Card title={t('portfolio.title')}>
			<div
				className="space-y-5"
				onDragOver={(e) => {
					e.preventDefault();
					if (!isDragging) setIsDragging(true);
				}}
				onDragLeave={(e) => {
					e.preventDefault();
					if (e.currentTarget === e.target) setIsDragging(false);
				}}
				onDrop={handleDrop}>
				<p className="text-sm text-zinc-500">{t('portfolio.subtitle')}</p>

				{/* Breadcrumbs + refresh */}
				<div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2">
					<FileBreadcrumbs segments={breadcrumbs} onNavigate={navigateTo} />
					<button
						type="button"
						onClick={() => refetch()}
						className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
						title={t('portfolio.toolbar.refresh')}
						aria-label={t('portfolio.toolbar.refresh')}>
						<ArrowPathIcon className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
					</button>
				</div>

				{/* Toolbar */}
				<div className="flex flex-wrap items-center gap-2">
					<Button variant="primary" size="md" onClick={() => setShowCreateFolder(true)}>
						<FolderPlusIcon className="h-5 w-5" />
						{t('portfolio.toolbar.newFolder')}
					</Button>
					<Button
						variant="secondary"
						size="md"
						disabled={isUploading}
						onClick={() => fileInputRef.current?.click()}>
						<ArrowUpTrayIcon className="h-5 w-5" />
						{isUploading
							? `${t('portfolio.dropzone.uploading')} ${uploadProgress.done}/${uploadProgress.total}`
							: t('portfolio.toolbar.upload')}
					</Button>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="hidden"
						onChange={handleInputUpload}
					/>
					{selectedCount > 0 && (
						<>
							<Button variant="surface" size="md" onClick={handleDownloadSelected}>
								<ArrowDownTrayIcon className="h-5 w-5" />
								{t('portfolio.toolbar.download')} ({selectedCount})
							</Button>
							<Button
								variant="warning"
								size="md"
								onClick={() => setConfirmDelete(entries.filter((e) => selectedKeys.has(e.key)))}>
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
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t('portfolio.toolbar.searchPlaceholder')}
							className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm placeholder-zinc-400 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
						/>
					</div>
				</div>

				{/* Dropzone hint (visible while dragging) */}
				{isDragging && (
					<div className="pointer-events-none flex items-center justify-center rounded-xl border-2 border-dashed border-red-400 bg-red-50/60 py-10 text-center">
						<div>
							<CloudArrowUpIcon className="mx-auto mb-2 h-10 w-10 text-red-400" />
							<p className="text-sm font-semibold text-red-600">{t('portfolio.dropzone.drop')}</p>
						</div>
					</div>
				)}

				{/* Listing */}
				{!isDragging && renderBody()}
			</div>

			{/* Modals */}
			<CreateFolderDialog
				key={showCreateFolder ? 'open' : 'closed'}
				isOpen={showCreateFolder}
				onClose={() => setShowCreateFolder(false)}
				onConfirm={handleCreateFolder}
				isLoading={creatingFolder}
			/>

			<ConfirmDialog
				isOpen={confirmDelete != null}
				onClose={() => setConfirmDelete(null)}
				onConfirm={handleConfirmDelete}
				onDecline={() => setConfirmDelete(null)}
				title={t('portfolio.delete.title')}
				message={
					confirmDelete && confirmDelete.length === 1
						? t('portfolio.delete.bodyOne').replace('{{name}}', confirmDelete[0].name)
						: t('portfolio.delete.bodyMany').replace(
								'{{count}}',
								String(confirmDelete?.length ?? 0),
							)
				}
				confirmLabel={t('portfolio.delete.confirm')}
				isLoading={deleting}
			/>

			{successMessage && (
				<SuccessDialog isOpen onClose={() => setSuccessMessage(null)} message={successMessage} />
			)}

			{toastError && (
				<Toast isOpen type="error" onClose={() => setToastError(null)} message={toastError} />
			)}
		</Card>
	);
}
