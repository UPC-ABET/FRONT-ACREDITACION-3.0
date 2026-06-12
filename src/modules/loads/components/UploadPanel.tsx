'use client';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import {
	Button,
	Card,
	ErrorDialog,
	LoadingDialog,
	SuccessDialog,
	Toast,
} from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils';
import { useI18n } from '@/providers';
import type { TypeOption } from '@/modules/core';
import { downloadErrorExcel, useDownloadTemplate, useUpload } from '../hooks';
import type { UploadResult } from '../types';

interface UploadPanelProps {
	type: TypeOption;
	academicPeriodId: number;
}

export default function UploadPanel({ type, academicPeriodId }: UploadPanelProps) {
	const { t, locale } = useI18n();
	const inputRef = useRef<HTMLInputElement>(null);
	const upload = useUpload(type.code);
	const downloadTemplate = useDownloadTemplate(type.code);
	const { toast, handleError, clearToast } = useApiErrorToast();
	const [file, setFile] = useState<File | null>(null);
	const [localError, setLocalError] = useState<string | null>(null);
	const [result, setResult] = useState<UploadResult | null>(null);
	const [successOpen, setSuccessOpen] = useState(false);
	const [errorOpen, setErrorOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [isDraggingFile, setIsDraggingFile] = useState(false);

	const handleFileChange = (selected: File | null) => {
		setLocalError(null);
		setResult(null);
		setFile(selected);
	};

	const isExcelFile = (selected: File) =>
		selected.name.toLowerCase().endsWith('.xlsx') ||
		selected.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

	const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		event.stopPropagation();
		setIsDraggingFile(false);

		const selected = event.dataTransfer.files?.[0] ?? null;
		if (!selected) return;

		if (!isExcelFile(selected)) {
			handleFileChange(null);
			setLocalError(t('loads.upload.error.fileTypeInvalid'));
			if (inputRef.current) inputRef.current.value = '';
			return;
		}

		handleFileChange(selected);
		if (inputRef.current) inputRef.current.value = '';
	};

	const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		event.stopPropagation();
		event.dataTransfer.dropEffect = 'copy';
		setIsDraggingFile(true);
	};

	const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
		setIsDraggingFile(false);
	};

	const handleDownloadTemplate = () => {
		const slug = type.code.toLowerCase();
		downloadTemplate.mutate(
			{ lang: locale, fallbackFileName: `${slug}-template.xlsx` },
			{ onError: (err) => handleError(err, 'loads.upload.error.templateDownloadFailed') },
		);
	};

	const handleUpload = () => {
		if (!file) {
			setLocalError(t('loads.upload.error.fileRequired'));
			return;
		}
		if (!academicPeriodId) {
			setLocalError(t('loads.upload.error.periodRequired'));
			return;
		}
		upload.mutate(
			{ file, lang: locale },
			{
				onSuccess: (data) => {
					setResult(data);
					if (data.success) {
						setSuccessOpen(true);
						setFile(null);
						if (inputRef.current) inputRef.current.value = '';
					} else {
						if (data.excelWithErrors && data.fileName) {
							downloadErrorExcel(data.excelWithErrors, data.fileName);
						}
						setErrorMessage(t('loads.upload.error.rowsWithErrors'));
						setErrorOpen(true);
					}
				},
				onError: (err) => {
					const raw = err instanceof Error ? err.message : '';
					const translated = raw ? tryTranslate(t, raw) : raw;
					setErrorMessage(
						translated && translated !== raw ? translated : t('loads.upload.error.generic'),
					);
					setErrorOpen(true);
				},
			},
		);
	};

	const fileInputId = `loads-upload-${type.code}-file`;
	const title = type.name[locale] ?? type.code;
	const subtitle = type.description?.[locale];

	return (
		<>
			<Card>
				<div className="space-y-5">
					<header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
						<div className="space-y-1">
							<h2 className="text-lg font-semibold text-gray-900">{title}</h2>
							{subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
						</div>
						<Button
							variant="surface"
							size="sm"
							onClick={handleDownloadTemplate}
							disabled={downloadTemplate.isPending}
							className="w-full sm:w-auto sm:self-start">
							<Download className="h-4 w-4" />
							<span>
								{downloadTemplate.isPending
									? t('loads.upload.downloadingTemplate')
									: t('loads.upload.downloadTemplate')}
							</span>
						</Button>
					</header>

					<label
						htmlFor={fileInputId}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragEnter={handleDragOver}
						onDragLeave={handleDragLeave}
						className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
							isDraggingFile
								? 'border-red-500 bg-red-50'
								: 'border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50/40'
						}`}>
						<Upload
							className={`mb-2 h-6 w-6 ${isDraggingFile ? 'text-red-500' : 'text-gray-400'}`}
						/>
						<span
							className={`text-sm font-medium ${
								isDraggingFile ? 'text-red-700' : 'text-gray-700'
							}`}>
							{file ? file.name : t('loads.upload.dropzone')}
						</span>
						<span className="mt-1 text-xs text-gray-400">.xlsx</span>
						<input
							id={fileInputId}
							ref={inputRef}
							type="file"
							accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
							className="hidden"
							onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
						/>
					</label>

					{localError && <p className="text-sm text-red-600">{localError}</p>}

					{result?.success && (
						<p className="text-sm text-green-600">
							{t('loads.upload.loadedSummary')}: {result.loadedRows}/{result.totalRows}
						</p>
					)}

					<div className="flex justify-end">
						<Button variant="primary" onClick={handleUpload} disabled={upload.isPending || !file}>
							{t('loads.upload.submit')}
						</Button>
					</div>
				</div>
			</Card>

			<LoadingDialog isOpen={upload.isPending} />
			<SuccessDialog
				isOpen={successOpen}
				onClose={() => setSuccessOpen(false)}
				title={t('loads.upload.successTitle')}
				message={t('loads.upload.successMessage')}
			/>
			<ErrorDialog
				isOpen={errorOpen}
				onClose={() => setErrorOpen(false)}
				title={t('loads.upload.errorTitle')}
				message={errorMessage}
			/>
			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</>
	);
}
