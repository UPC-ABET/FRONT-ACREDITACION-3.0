'use client';

import React, { useRef, useState } from 'react';
import { Button, Toast } from '@/shared/components';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';

interface FileUploadPanelProps {
	readonly title: string;
	readonly description?: string;
	readonly accept?: string;
	readonly uploading: boolean;
	readonly success: boolean;
	readonly error: string | null;
	readonly onUpload: (file: File) => void;
	readonly onDownloadTemplate?: () => void;
	readonly downloadLabel: string;
}

const MAX_SIZE_MB = 10;

export function FileUploadPanel({
	title,
	description,
	accept = '.xlsx,.xls',
	uploading,
	success,
	error,
	onUpload,
	onDownloadTemplate,
	downloadLabel,
}: FileUploadPanelProps) {
	const { t } = useI18n();
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [isDraggingFile, setIsDraggingFile] = useState(false);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	function selectFile(file: File) {
		setValidationError(null);

		const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
		const validExts = accept.split(',').map((a) => a.trim().toLowerCase());
		if (!validExts.includes(ext)) {
			setValidationError(
				t('surveys.shared.fileUpload.invalidFormat').replace('{{accept}}', accept),
			);
			return;
		}
		if (file.size > MAX_SIZE_MB * 1024 * 1024) {
			setValidationError(
				t('surveys.shared.fileUpload.fileTooLarge').replace('{{mb}}', String(MAX_SIZE_MB)),
			);
			return;
		}
		setSelectedFile(file);
	}

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		selectFile(file);
	}

	function handleDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		setIsDraggingFile(false);

		const file = e.dataTransfer.files?.[0];
		if (!file) return;
		selectFile(file);
		if (inputRef.current) inputRef.current.value = '';
	}

	function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = 'copy';
		setIsDraggingFile(true);
	}

	function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
		if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
		setIsDraggingFile(false);
	}

	function handleUpload() {
		if (!selectedFile) return;
		onUpload(selectedFile);
	}

	React.useEffect(() => {
		if (success) {
			setToast({
				open: true,
				type: 'success',
				msg: t('surveys.shared.fileUpload.processedSuccess'),
			});
			setSelectedFile(null);
			if (inputRef.current) inputRef.current.value = '';
		}
	}, [success, t]);

	React.useEffect(() => {
		if (error) setToast({ open: true, type: 'error', msg: error });
	}, [error]);

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">{title}</h3>
				{description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
			</div>

			{onDownloadTemplate && (
				<div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
					<ArrowDownTrayIcon className="h-5 w-5 text-zinc-400 shrink-0" />
					<div className="flex-1">
						<p className="text-sm font-medium text-zinc-700">
							{t('surveys.shared.fileUpload.step1Title')}
						</p>
						<p className="text-xs text-zinc-500">{t('surveys.shared.fileUpload.step1Desc')}</p>
					</div>
					<Button variant="surface" size="sm" onClick={onDownloadTemplate}>
						{downloadLabel}
					</Button>
				</div>
			)}

			<div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-3">
				<div className="flex items-center gap-3">
					<ArrowUpTrayIcon className="h-5 w-5 text-zinc-400 shrink-0" />
					<p className="text-sm font-medium text-zinc-700">
						{onDownloadTemplate
							? t('surveys.shared.fileUpload.step2Title')
							: t('surveys.shared.fileUpload.selectFile')}
					</p>
				</div>

				<div
					role="button"
					tabIndex={0}
					className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
						isDraggingFile
							? 'border-red-500 bg-red-50'
							: 'border-zinc-300 hover:border-red-400'
					}`}
					onClick={() => inputRef.current?.click()}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragEnter={handleDragOver}
					onDragLeave={handleDragLeave}
					onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}>
					<DocumentIcon className={`h-8 w-8 ${isDraggingFile ? 'text-red-500' : 'text-zinc-400'}`} />
					{selectedFile ? (
						<p className="text-sm font-medium text-zinc-700">{selectedFile.name}</p>
					) : (
						<p className="text-sm text-zinc-500">{t('surveys.shared.fileUpload.clickToSelect')}</p>
					)}
					<p className="text-xs text-zinc-400">
						{t('surveys.shared.fileUpload.formats')
							.replace('{{accept}}', accept)
							.replace('{{mb}}', String(MAX_SIZE_MB))}
					</p>
				</div>

				<input
					ref={inputRef}
					type="file"
					accept={accept}
					className="hidden"
					onChange={handleFileChange}
				/>

				{validationError && <p className="text-xs text-red-600">{validationError}</p>}

				<Button onClick={handleUpload} disabled={!selectedFile || uploading} className="w-full">
					{uploading
						? t('surveys.shared.fileUpload.uploading')
						: t('surveys.shared.fileUpload.uploadButton')}
				</Button>
			</div>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
