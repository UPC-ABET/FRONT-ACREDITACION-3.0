'use client';

import React, { useEffect, useState } from 'react';
import { Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate, triggerBrowserDownload } from '@/shared/utils';
import { FileUploadPanel } from '../shared/FileUploadPanel';
import { UploadResultSummary } from '../shared/UploadResultSummary';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { PPPUploadProgressDialog } from './PPPUploadProgressDialog';
import { usePPPUpload } from '../../hooks';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function downloadErrorExcel(base64: string, fileName: string): void {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	triggerBrowserDownload(new Blob([bytes], { type: XLSX_MIME }), fileName);
}

export function PPPMassiveUpload() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [programId, setProgramId] = useState(0);
	const { loading, error, status, result, upload } = usePPPUpload();
	const [progressDialogOpen, setProgressDialogOpen] = useState(false);

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'error',
		msg: '',
	});

	// PPP's bulk upload is all-or-nothing: any row with an error means nothing was
	// saved. When that happens, auto-download the same file with an "Errores" column
	// added instead of the generic "processed successfully" toast.
	useEffect(() => {
		if (!result || result.failed === 0) return;
		if (result.excelWithErrors && result.fileName) {
			downloadErrorExcel(result.excelWithErrors, result.fileName);
		}
		// eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the parent's async upload result to trigger a download side effect and a dismissible toast; neither is derivable during render
		setToast({ open: true, type: 'error', msg: t('surveys.ppp.upload.rowsWithErrors') });
		// eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per new `result` reference (a fresh upload attempt), not on every render
	}, [result]);

	async function handleDownloadTemplate() {
		if (!academicPeriodId) return;
		if (!programId) {
			setToast({
				open: true,
				type: 'error',
				msg: t('surveys.ppp.upload.selectProgramForTemplate'),
			});
			return;
		}
		try {
			const { downloadPPPTemplate } = await import('../../services/pppService');
			await downloadPPPTemplate(programId);
		} catch (err) {
			const msg = err instanceof Error ? err.message : t('surveys.ppp.upload.downloadError');
			setToast({ open: true, type: 'error', msg: tryTranslate(t, msg) });
		}
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-5">
			<AllProgramsSelect value={programId} onChange={setProgramId} wrapperClassName="max-w-xs" />

			<div>
				<h3 className="text-base font-bold text-zinc-800">{t('surveys.ppp.upload.title')}</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.upload.description')}</p>
			</div>

			<FileUploadPanel
				title={t('surveys.ppp.upload.fileTitle')}
				uploading={loading}
				success={result != null && result.failed === 0}
				error={error}
				onUpload={(file) => {
					if (!programId) {
						setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
						return;
					}
					setProgressDialogOpen(true);
					upload(file, programId);
				}}
				onDownloadTemplate={handleDownloadTemplate}
				downloadLabel={t('surveys.ppp.upload.downloadLabel')}
			/>

			{result && <UploadResultSummary result={result} />}

			<PPPUploadProgressDialog
				open={progressDialogOpen}
				uploading={loading}
				status={status}
				error={error ? tryTranslate(t, error) : null}
				onOpenChange={setProgressDialogOpen}
			/>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
