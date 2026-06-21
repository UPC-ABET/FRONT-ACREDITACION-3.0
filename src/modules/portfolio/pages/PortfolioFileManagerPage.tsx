'use client';

import { type DragEvent, useMemo, useRef, useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { Card } from '@/shared/components/ui';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { S3Entry } from '../types';
import {
	useCopyEntries,
	useCreateFolder,
	useCreateTextFile,
	useDeleteEntries,
	useFileManagerSelection,
	useMoveEntries,
	usePortfolioFiles,
	useRenameEntry,
	useUploadFiles,
} from '../hooks';
import { portfolioS3Service } from '../services';
import {
	buildBreadcrumbs,
	FileManagerBody,
	FileManagerDialogs,
	FileManagerHeader,
	FileManagerToolbar,
	formatBytes,
} from '../components';

/** Download guard: refuse selections larger than 1 GB (matches the legacy client). */
const DOWNLOAD_LIMIT = 1024 ** 3;
/** Upload guard: skip files larger than 4 GB. */
const FILE_LIMIT = 4 * 1024 ** 3;

export function PortfolioFileManagerPage() {
	const { t } = useI18n();

	const {
		prefix,
		search,
		setSearch,
		selectedKeys,
		setSelectedKeys,
		clearSelection,
		navigateTo,
		toggleSelect,
	} = useFileManagerSelection();
	const [showCreateFolder, setShowCreateFolder] = useState(false);
	const [showCreateComment, setShowCreateComment] = useState(false);
	const [showTree, setShowTree] = useState(false);
	const [renameTarget, setRenameTarget] = useState<S3Entry | null>(null);
	const [moveSources, setMoveSources] = useState<S3Entry[] | null>(null);
	const [clipboard, setClipboard] = useState<S3Entry[]>([]);
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
	const { mutateAsync: createTextFile, isPending: creatingComment } = useCreateTextFile();
	const { mutateAsync: renameEntry, isPending: renaming } = useRenameEntry();
	const { mutateAsync: copyEntries } = useCopyEntries();
	const { mutateAsync: moveEntries, isPending: moving } = useMoveEntries();
	const { mutateAsync: deleteEntries, isPending: deleting } = useDeleteEntries();
	const { mutateAsync: uploadFiles } = useUploadFiles();

	// Surfaces a thrown i18n key (or raw message) as a translated toast.
	function showError(e: unknown, fallbackKey: string) {
		setToastError(t(getErrorMessage(e, fallbackKey)));
	}

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

	const selectedEntries = useMemo(
		() => entries.filter((e) => selectedKeys.has(e.key)),
		[entries, selectedKeys],
	);

	function toggleAll() {
		setSelectedKeys((prev) => {
			if (entries.length > 0 && entries.every((e) => prev.has(e.key))) return new Set();
			return new Set(entries.map((e) => e.key));
		});
	}

	/** Performs the actual download for one entry (no size guard). */
	async function downloadEntry(entry: S3Entry) {
		setDownloadingKey(entry.key);
		try {
			if (entry.isFolder) await portfolioS3Service.downloadFolder(entry.key, entry.name);
			else await portfolioS3Service.downloadFile(entry.key, entry.name);
		} catch (e) {
			showError(e, 'portfolio.error.downloadFailed');
		} finally {
			setDownloadingKey(null);
		}
	}

	/** Returns true when the combined size of `keys` is within the download limit. */
	async function withinDownloadLimit(keys: string[]): Promise<boolean> {
		try {
			const bytes = await portfolioS3Service.totalSize(keys);
			if (bytes > DOWNLOAD_LIMIT) {
				setToastError(
					t('portfolio.guard.downloadTooLarge').replace('{{size}}', formatBytes(bytes)),
				);
				return false;
			}
			return true;
		} catch (e) {
			showError(e, 'portfolio.error.sizeFailed');
			return false;
		}
	}

	async function handleDownload(entry: S3Entry) {
		// Only folders need the size guard; a single file is bounded by the upload limit.
		if (entry.isFolder && !(await withinDownloadLimit([entry.key]))) return;
		await downloadEntry(entry);
	}

	async function handleDownloadSelected() {
		if (selectedEntries.length === 0) return;
		if (!(await withinDownloadLimit(selectedEntries.map((e) => e.key)))) return;
		if (selectedEntries.length === 1) {
			await downloadEntry(selectedEntries[0]);
			return;
		}
		// One server-side zip avoids the N browser downloads that get blocked when triggered in a loop.
		try {
			await portfolioS3Service.downloadSelection(
				selectedEntries.map((e) => e.key),
				t('portfolio.download.selectionName'),
			);
		} catch (e) {
			showError(e, 'portfolio.error.downloadFailed');
		}
	}

	async function handleCreateFolder(name: string) {
		try {
			await createFolder({ prefix, name });
			setShowCreateFolder(false);
			setSuccessMessage(t('portfolio.toast.folderCreated'));
		} catch (e) {
			setShowCreateFolder(false);
			showError(e, 'portfolio.error.createFolderFailed');
		}
	}

	async function handleCreateComment(name: string) {
		try {
			await createTextFile({ prefix, name });
			setShowCreateComment(false);
			setSuccessMessage(t('portfolio.toast.commentCreated'));
		} catch (e) {
			setShowCreateComment(false);
			showError(e, 'portfolio.error.createCommentFailed');
		}
	}

	async function handleRename(newName: string) {
		if (!renameTarget) return;
		try {
			await renameEntry({ key: renameTarget.key, newName });
			setRenameTarget(null);
			clearSelection();
			setSuccessMessage(t('portfolio.toast.renamed'));
		} catch (e) {
			setRenameTarget(null);
			showError(e, 'portfolio.error.renameFailed');
		}
	}

	async function handleMove(destPrefix: string) {
		if (!moveSources) return;
		try {
			await moveEntries({ keys: moveSources.map((s) => s.key), destPrefix });
			setMoveSources(null);
			clearSelection();
			setSuccessMessage(t('portfolio.toast.moved'));
		} catch (e) {
			setMoveSources(null);
			showError(e, 'portfolio.error.moveFailed');
		}
	}

	function handleCopy() {
		setClipboard(selectedEntries);
		clearSelection();
		setSuccessMessage(t('portfolio.toast.copied'));
	}

	async function handlePaste() {
		if (clipboard.length === 0) return;
		try {
			await copyEntries({ keys: clipboard.map((c) => c.key), destPrefix: prefix });
			setClipboard([]);
			setSuccessMessage(t('portfolio.toast.pasted'));
		} catch (e) {
			showError(e, 'portfolio.error.copyFailed');
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
			showError(e, 'portfolio.error.deleteFailed');
		}
	}

	async function uploadFileList(files: File[]) {
		const tooBig = files.filter((f) => f.size > FILE_LIMIT);
		const allowed = files.filter((f) => f.size <= FILE_LIMIT);
		if (tooBig.length > 0) {
			setToastError(t('portfolio.guard.fileTooLarge').replace('{{count}}', String(tooBig.length)));
		}
		if (allowed.length === 0) return;
		setUploadProgress({ done: 0, total: allowed.length });
		try {
			await uploadFiles({
				prefix,
				files: allowed,
				onProgress: (done, total) => setUploadProgress({ done, total }),
			});
			setSuccessMessage(t('portfolio.toast.uploaded'));
		} catch (e) {
			showError(e, 'portfolio.error.uploadFailed');
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
				<FileManagerHeader
					segments={breadcrumbs}
					onNavigate={navigateTo}
					onRefresh={() => refetch()}
					isFetching={isFetching}
				/>

				{/* Toolbar */}
				<FileManagerToolbar
					fileInputRef={fileInputRef}
					isUploading={isUploading}
					uploadProgress={uploadProgress}
					clipboardCount={clipboard.length}
					selectedCount={selectedCount}
					search={search}
					onSearchChange={setSearch}
					onNewFolder={() => setShowCreateFolder(true)}
					onNewComment={() => setShowCreateComment(true)}
					onOpenTree={() => setShowTree(true)}
					onInputUpload={handleInputUpload}
					onPaste={handlePaste}
					onCopy={handleCopy}
					onRename={() => setRenameTarget(selectedEntries[0])}
					onMove={() => setMoveSources(selectedEntries)}
					onDownloadSelected={handleDownloadSelected}
					onDeleteSelected={() => setConfirmDelete(selectedEntries)}
				/>

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
				{!isDragging && (
					<FileManagerBody
						isLoading={isLoading}
						isError={isError}
						error={error}
						entries={entries}
						search={search}
						selectedKeys={selectedKeys}
						onToggleSelect={toggleSelect}
						onToggleAll={toggleAll}
						onOpenFolder={(entry) => navigateTo(entry.key)}
						onDownload={handleDownload}
						onDeleteOne={(entry) => setConfirmDelete([entry])}
						downloadingKey={downloadingKey}
					/>
				)}
			</div>

			{/* Modals */}
			<FileManagerDialogs
				prefix={prefix}
				showCreateFolder={showCreateFolder}
				onCloseCreateFolder={() => setShowCreateFolder(false)}
				onConfirmCreateFolder={handleCreateFolder}
				creatingFolder={creatingFolder}
				showCreateComment={showCreateComment}
				onCloseCreateComment={() => setShowCreateComment(false)}
				onConfirmCreateComment={handleCreateComment}
				creatingComment={creatingComment}
				renameTarget={renameTarget}
				onCloseRename={() => setRenameTarget(null)}
				onConfirmRename={handleRename}
				renaming={renaming}
				moveSources={moveSources}
				onCloseMove={() => setMoveSources(null)}
				onConfirmMove={handleMove}
				moving={moving}
				showTree={showTree}
				onCloseTree={() => setShowTree(false)}
				confirmDelete={confirmDelete}
				onCloseConfirmDelete={() => setConfirmDelete(null)}
				onConfirmDelete={handleConfirmDelete}
				deleting={deleting}
				successMessage={successMessage}
				onCloseSuccess={() => setSuccessMessage(null)}
				toastError={toastError}
				onCloseToast={() => setToastError(null)}
			/>
		</Card>
	);
}
