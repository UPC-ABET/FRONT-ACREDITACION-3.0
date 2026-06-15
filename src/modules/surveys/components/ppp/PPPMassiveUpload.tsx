'use client';

import React, { useEffect, useState } from 'react';
import { Select, SubTitle, Title, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { FileUploadPanel } from '../shared/FileUploadPanel';
import { usePPPUpload, usePPPCycles } from '../../hooks';
import { useABET } from '@/providers';

export function PPPMassiveUpload() {
	const { t } = useI18n();
	const { modalityTypeId } = useABET();
	const { cycles, load: loadCycles } = usePPPCycles();
	const { loading, error, success, upload } = usePPPUpload();

	const [selectedCycle, setSelectedCycle] = useState<{ label: string; value: number } | null>(null);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'error',
		msg: '',
	});

	useEffect(() => {
		loadCycles(modalityTypeId);
	}, [modalityTypeId, loadCycles]);

	const cycleOptions = cycles.map((c) => ({ label: c.name, value: c.id }));

	async function handleDownloadTemplate() {
		if (!selectedCycle) return;
		try {
			const { downloadPPPTemplate } = await import('../../services/pppService');
			await downloadPPPTemplate(selectedCycle.value);
		} catch (err) {
			const msg = err instanceof Error ? err.message : t('surveys.ppp.upload.downloadError');
			setToast({ open: true, type: 'error', msg });
		}
	}

	return (
		<div className="max-w-lg space-y-5">
			<div>
				<Title
					title={t('surveys.ppp.upload.title')}
					className="[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-zinc-800"
				/>
				<SubTitle
					name={t('surveys.ppp.upload.description')}
					className="mt-1 [&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-500"
				/>
			</div>

			<Select
				label={t('surveys.shared.academicCycle')}
				options={cycleOptions}
				value={selectedCycle}
				onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
				placeholder={t('surveys.shared.selectCycle')}
				isSearchable
			/>

			<FileUploadPanel
				title={t('surveys.ppp.upload.fileTitle')}
				uploading={loading}
				success={success}
				error={error}
				onUpload={(file) => (selectedCycle ? upload(file, selectedCycle.value) : Promise.resolve())}
				onDownloadTemplate={selectedCycle ? handleDownloadTemplate : undefined}
				downloadLabel={t('surveys.ppp.upload.downloadLabel')}
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
