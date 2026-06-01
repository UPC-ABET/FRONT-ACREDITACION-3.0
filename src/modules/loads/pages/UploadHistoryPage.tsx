'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/providers';
import { ErrorsDrawer, RollbackConfirmDialog, UploadHistoryTable } from '../components';
import { findFlowByTypeCode, LOADS_QUERY_KEYS } from '../constants';
import { rollbackUpload } from '../services';
import type { UploadLog } from '../types';

export default function UploadHistoryPage() {
	const { t } = useI18n();
	const queryClient = useQueryClient();
	const [confirmLog, setConfirmLog] = useState<UploadLog | null>(null);
	const [errorsLog, setErrorsLog] = useState<UploadLog | null>(null);
	const [rolling, setRolling] = useState(false);

	const handleConfirm = async (log: UploadLog) => {
		if (!findFlowByTypeCode(log.uploadType.code)) {
			setConfirmLog(null);
			return;
		}
		setRolling(true);
		try {
			await rollbackUpload(log.uploadType.code, { uploadLogId: log.id });
			await queryClient.invalidateQueries({ queryKey: LOADS_QUERY_KEYS.uploadHistory });
			setConfirmLog(null);
		} finally {
			setRolling(false);
		}
	};

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
			<header className="space-y-1">
				<h1 className="text-2xl font-semibold text-gray-900">{t('uploadHistory.title')}</h1>
				<p className="text-sm text-gray-500">{t('uploadHistory.subtitle')}</p>
			</header>

			<UploadHistoryTable
				onRollback={(log) => setConfirmLog(log)}
				onViewErrors={(log) => setErrorsLog(log)}
			/>

			<RollbackConfirmDialog
				log={confirmLog}
				open={confirmLog !== null}
				onClose={() => setConfirmLog(null)}
				onConfirm={handleConfirm}
				loading={rolling}
			/>

			<ErrorsDrawer
				open={errorsLog !== null}
				onClose={() => setErrorsLog(null)}
				excelBase64={null}
			/>
		</div>
	);
}
