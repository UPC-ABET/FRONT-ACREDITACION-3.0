'use client';

import React, { useState } from 'react';
import { Toast } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { FileUploadPanel } from '../shared/FileUploadPanel';
import { UploadResultSummary } from '../shared/UploadResultSummary';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { usePPPUpload } from '../../hooks';

export function PPPMassiveUpload() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [programId, setProgramId] = useState(0);
	const { loading, error, success, result, upload } = usePPPUpload();

	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'error',
		msg: '',
	});

	async function handleDownloadTemplate() {
		if (!academicPeriodId) return;
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
				success={success}
				error={error}
				onUpload={(file) => {
					if (!programId) {
						setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
						return;
					}
					upload(file, academicPeriodId, programId);
				}}
				onDownloadTemplate={handleDownloadTemplate}
				downloadLabel={t('surveys.ppp.upload.downloadLabel')}
			/>

			{result && <UploadResultSummary result={result} />}

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
