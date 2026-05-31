'use client';

import React, { useEffect } from 'react';
import { Select, Button, Toast } from '@/shared/components';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { usePPPDownload, usePPPCycles } from '../../hooks';
import { useABET } from '@/providers';

export function PPPDownloadTemplate() {
	const { t } = useI18n();
	const { modalityTypeId } = useABET();
	const { cycles, load: loadCycles } = usePPPCycles();
	const { loading, error, download } = usePPPDownload();

	const [selectedCycle, setSelectedCycle] = React.useState<{ label: string; value: number } | null>(
		null,
	);
	const [toast, setToast] = React.useState<{
		open: boolean;
		type: 'success' | 'error';
		msg: string;
	}>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		loadCycles(modalityTypeId);
	}, [modalityTypeId, loadCycles]);

	useEffect(() => {
		if (error) setToast({ open: true, type: 'error', msg: error });
	}, [error]);

	async function handleDownload() {
		if (!selectedCycle) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		await download(selectedCycle.value);
		if (!error)
			setToast({ open: true, type: 'success', msg: t('surveys.ppp.download.success') });
	}

	const cycleOptions = cycles.map((c) => ({ label: c.name, value: c.id }));

	return (
		<div className="max-w-md space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">{t('surveys.ppp.download.title')}</h3>
				<p className="text-sm text-zinc-500 mt-1">
					{t('surveys.ppp.download.description')}
				</p>
			</div>

			<Select
				label={t('surveys.shared.academicCycle')}
				options={cycleOptions}
				value={selectedCycle}
				onChange={(_, val) => setSelectedCycle(val as { label: string; value: number } | null)}
				placeholder={t('surveys.shared.selectCycle')}
				isSearchable
			/>

			<Button onClick={handleDownload} disabled={loading || !selectedCycle}>
				<ArrowDownTrayIcon className="h-4 w-4 mr-2" />
				{loading ? t('surveys.ppp.download.downloading') : t('surveys.ppp.download.button')}
			</Button>

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
}
