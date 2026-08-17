'use client';

import React, { useState } from 'react';
import { Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { FileUploadPanel } from '../shared/FileUploadPanel';
import { UploadResultSummary } from '../shared/UploadResultSummary';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { PPPUploadProgressDialog } from './PPPUploadProgressDialog';
import { usePPPUpload } from '../../hooks';

interface PPPMassiveUploadProps {
	/** Owned by PPPManagementView so the selection survives switching tabs. */
	readonly programId: number;
	readonly onProgramChange: (programId: number) => void;
}

export function PPPMassiveUpload({ programId, onProgramChange }: PPPMassiveUploadProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { loading, error, status, jobId, result, upload } = usePPPUpload();
	const [progressDialogOpen, setProgressDialogOpen] = useState(false);
	const [downloadingErrors, setDownloadingErrors] = useState(false);

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'error',
		msg: '',
	});

	// PPP's bulk upload is all-or-nothing: any row with an error means nothing was saved, and
	// the backend keeps the annotated workbook behind its own endpoint. The download is tied to
	// a click rather than fired automatically — a browser that blocks unprompted downloads would
	// otherwise leave the user with no way to reach the only record of what went wrong.
	async function handleDownloadErrors() {
		if (!jobId) return;
		setDownloadingErrors(true);
		try {
			const { downloadPPPUploadErrors } = await import('../../services/pppService');
			await downloadPPPUploadErrors(jobId);
		} catch (err) {
			const msg = err instanceof Error ? err.message : t('surveys.ppp.upload.downloadError');
			setToast({ open: true, type: 'error', msg: tryTranslate(t, msg) });
		} finally {
			setDownloadingErrors(false);
		}
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
				// The progress dialog already reports failures; letting the panel raise its own
				// toast puts a second copy behind the open modal.
				error={null}
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
				downloadingErrors={downloadingErrors}
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
