'use client';

import React, { useRef, useState } from 'react';
import { Button, Toast } from '@/shared/components';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';

interface FileUploadPanelProps {
	title: string;
	description?: string;
	accept?: string;
	uploading: boolean;
	success: boolean;
	error: string | null;
	onUpload: (file: File) => void;
	onDownloadTemplate?: () => void;
	downloadLabel?: string;
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
	downloadLabel = 'Descargar Plantilla',
}: FileUploadPanelProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		setValidationError(null);

		const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
		const validExts = accept.split(',').map((a) => a.trim().toLowerCase());
		if (!validExts.includes(ext)) {
			setValidationError(`Formato inválido. Use: ${accept}`);
			return;
		}
		if (file.size > MAX_SIZE_MB * 1024 * 1024) {
			setValidationError(`Archivo muy grande. Máximo ${MAX_SIZE_MB}MB.`);
			return;
		}
		setSelectedFile(file);
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
				msg: 'Archivo procesado exitosamente. Se descargó el reporte.',
			});
			setSelectedFile(null);
			if (inputRef.current) inputRef.current.value = '';
		}
	}, [success]);

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
						<p className="text-sm font-medium text-zinc-700">Paso 1: Descarga la plantilla</p>
						<p className="text-xs text-zinc-500">
							Descarga la plantilla Excel, llénala con los datos y luego súbela.
						</p>
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
						{onDownloadTemplate ? 'Paso 2: Sube el archivo completado' : 'Selecciona el archivo'}
					</p>
				</div>

				<div
					className="border-2 border-dashed border-zinc-300 rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-red-400 transition-colors"
					onClick={() => inputRef.current?.click()}>
					<DocumentIcon className="h-8 w-8 text-zinc-400" />
					{selectedFile ? (
						<p className="text-sm font-medium text-zinc-700">{selectedFile.name}</p>
					) : (
						<p className="text-sm text-zinc-500">Haz clic para seleccionar un archivo</p>
					)}
					<p className="text-xs text-zinc-400">
						Formatos aceptados: {accept} · Máx. {MAX_SIZE_MB}MB
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
					{uploading ? 'Subiendo...' : 'Subir Archivo'}
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
