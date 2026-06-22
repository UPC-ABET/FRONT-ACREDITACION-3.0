'use client';

import React, { useEffect, useState } from 'react';
import { Button, Toast } from '@/shared/components';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useI18n, useABET } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { usePPPDownload } from '../../hooks';

interface PPPDownloadTemplateProps {
	readonly programId: number;
}

export function PPPDownloadTemplate({ programId }: PPPDownloadTemplateProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const { loading, error, download } = usePPPDownload();

	const [toast, setToast] = useState<{
		open: boolean;
		type: 'success' | 'error';
		msg: string;
	}>({
		open: false,
		type: 'success',
		msg: '',
	});

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- syncing the hook's async error into dismissible toast state; toast is user-mutable so it can't be derived during render
		if (error) setToast({ open: true, type: 'error', msg: tryTranslate(t, error) });
	}, [error, t]);

	async function handleDownload() {
		if (!academicPeriodId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectCycle') });
			return;
		}
		await download(academicPeriodId, programId);
		if (!error) setToast({ open: true, type: 'success', msg: t('surveys.ppp.download.success') });
	}

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="max-w-md space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">{t('surveys.ppp.download.title')}</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.download.description')}</p>
			</div>

			<Button onClick={handleDownload} disabled={loading} loading={loading}>
				<ArrowDownTrayIcon className="h-4 w-4 mr-2" />
				{t('surveys.ppp.download.button')}
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
