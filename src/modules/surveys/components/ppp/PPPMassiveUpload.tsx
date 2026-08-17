'use client';

import React, { useState } from 'react';
import { Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { base64ToBlob, tryTranslate, triggerBrowserDownload } from '@/shared/utils';
import { FileUploadPanel } from '../shared/FileUploadPanel';
import { UploadResultSummary } from '../shared/UploadResultSummary';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { PPPUploadProgressDialog } from './PPPUploadProgressDialog';
import { usePPPUpload } from '../../hooks';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface PPPMassiveUploadProps {
	/** Owned by PPPManagementView so the selection survives switching tabs. */
	readonly programId: number;
	readonly onProgramChange: (programId: number) => void;
}

export function PPPMassiveUpload({ programId, onProgramChange }: PPPMassiveUploadProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { loading, error, status, result, upload } = usePPPUpload();
	const [progressDialogOpen, setProgressDialogOpen] = useState(false);

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'error',
		msg: '',
	});

	// PPP's bulk upload is all-or-nothing: any row with an error means nothing was saved, and
	// the backend returns the same workbook with an "Errores" column appended. The download is
	// tied to a click rather than fired automatically — a browser that blocks unprompted
	// downloads would otherwise leave the user with no way to reach the only record of what
	// went wrong.
	function handleDownloadErrors() {
		if (!result?.excelWithErrors) return;
		triggerBrowserDownload(
			base64ToBlob(result.excelWithErrors, XLSX_MIME),
			result.fileName ?? 'PPP_errores.xlsx',
		);
	}

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
			<AllProgramsSelect value={programId} onChange={onProgramChange} wrapperClassName="max-w-xs" />

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
				onDownloadErrors={handleDownloadErrors}
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
