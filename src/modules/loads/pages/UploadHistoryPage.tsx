'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/providers';
import { PageHeader, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils';
import { ErrorsDrawer, RollbackConfirmDialog, UploadHistoryTable } from '../components';
import { findFlowByTypeCode, LOADS_QUERY_KEYS } from '../constants';
import { rollbackUpload } from '../services';
import type { UploadLog } from '../types';

export default function UploadHistoryPage() {
	const { t } = useI18n();
	const queryClient = useQueryClient();
	const { toast, showToast, clearToast } = useApiErrorToast();
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
		} catch (err) {
			const raw = err instanceof Error ? err.message : '';
			const translated = raw ? tryTranslate(t, raw) : raw;
			const message =
				translated && translated !== raw ? translated : t('loads.upload.error.generic');
			showToast(message, 'error');
		} finally {
			setRolling(false);
		}
	};

	return (
		<div className="w-full space-y-6">
			<PageHeader title={t('uploadHistory.title')} description={t('uploadHistory.subtitle')} />

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

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
