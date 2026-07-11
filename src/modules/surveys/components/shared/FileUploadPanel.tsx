'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { Button, Card, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { cn } from '@/shared/lib/utils';
import { SURVEY_FILE_UPLOAD_MAX_SIZE_MB } from '../../constants/survey';

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

function getAcceptLabel(accept: string) {
	const extensions = accept
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.startsWith('.'));

	return extensions.length ? extensions.join(' / ') : accept;
}

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
		if (file.size > SURVEY_FILE_UPLOAD_MAX_SIZE_MB * 1024 * 1024) {
			setValidationError(
				t('surveys.shared.fileUpload.fileTooLarge').replace(
					'{{mb}}',
					String(SURVEY_FILE_UPLOAD_MAX_SIZE_MB),
				),
			);
			return;
		}
		setSelectedFile(file);
	}

	function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		selectFile(file);
	}

	function handleDrop(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
		e.stopPropagation();
		setIsDraggingFile(false);

		const file = e.dataTransfer.files?.[0];
		if (!file) return;
		selectFile(file);
		if (inputRef.current) inputRef.current.value = '';
	}

	function handleDragOver(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = 'copy';
		setIsDraggingFile(true);
	}

	function handleDragLeave(e: DragEvent<HTMLButtonElement>) {
		e.preventDefault();
		e.stopPropagation();
		if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
		setIsDraggingFile(false);
	}

	function handleUpload() {
		if (!selectedFile) return;
		onUpload(selectedFile);
	}

	useEffect(() => {
		if (success) {
			/* eslint-disable react-hooks/set-state-in-effect -- reacting to the parent's async upload-success flag: showing dismissible toast state and clearing the selected-file draft; neither is derivable during render */
			setToast({
				open: true,
				type: 'success',
				msg: t('surveys.shared.fileUpload.processedSuccess'),
			});
			setSelectedFile(null);
			/* eslint-enable react-hooks/set-state-in-effect */
			if (inputRef.current) inputRef.current.value = '';
		}
	}, [success, t]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the parent's async upload error into dismissible toast state; toast is user-mutable so it can't be derived during render
		if (error) setToast({ open: true, type: 'error', msg: tryTranslate(t, error) });
	}, [error, t]);

	const acceptLabel = getAcceptLabel(accept);

	return (
		<>
			<Card>
				<div className="space-y-5">
					<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
						<div className="space-y-1">
							<h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
							{description && <p className="text-sm font-normal text-zinc-500">{description}</p>}
						</div>
						{onDownloadTemplate && (
							<Button
								variant="surface"
								size="sm"
								onClick={onDownloadTemplate}
								className="w-full sm:w-auto">
								<Download className="h-4 w-4" />
								<span>{downloadLabel}</span>
							</Button>
						)}
					</header>

					<button
						type="button"
						className={cn(
							'flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
							isDraggingFile
								? 'border-red-500 bg-red-50'
								: 'border-zinc-300 bg-zinc-50 hover:border-red-400 hover:bg-red-50/40',
						)}
						onClick={() => inputRef.current?.click()}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragEnter={handleDragOver}
						onDragLeave={handleDragLeave}>
						<Upload
							className={cn('mb-2 h-6 w-6', isDraggingFile ? 'text-red-500' : 'text-zinc-400')}
						/>
						<span
							className={cn(
								'text-sm font-medium',
								isDraggingFile ? 'text-red-700' : 'text-zinc-700',
							)}>
							{selectedFile ? selectedFile.name : t('surveys.shared.fileUpload.dropzone')}
						</span>
						<span className="mt-1 text-xs text-zinc-400">{acceptLabel}</span>
					</button>

					<input
						ref={inputRef}
						type="file"
						accept={accept}
						className="hidden"
						onChange={handleFileChange}
					/>

					{validationError && <p className="text-sm text-red-600">{validationError}</p>}

					<div className="flex justify-end">
						<Button variant="primary" onClick={handleUpload} disabled={!selectedFile || uploading}>
							{uploading
								? t('surveys.shared.fileUpload.uploading')
								: t('surveys.shared.fileUpload.uploadButton')}
						</Button>
					</div>
				</div>
			</Card>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</>
	);
}
