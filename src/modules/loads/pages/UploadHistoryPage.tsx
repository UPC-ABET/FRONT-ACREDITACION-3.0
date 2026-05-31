'use client';

import { useState } from 'react';
import { useI18n } from '@/providers';
import { ErrorsDrawer, RollbackConfirmDialog, UploadHistoryTable } from '../components';
import type { UploadLog } from '../types';

interface UploadHistoryPageProps {
	// Maps a backend upload_type code to a rollback function. The page stays presentational
	// and delegates dispatch to the container so it does not depend on every flow's service.
	rollbackByUploadType: Record<string, (uploadLogId: number) => Promise<{ success: boolean }>>;
}

export default function UploadHistoryPage({ rollbackByUploadType }: UploadHistoryPageProps) {
	const { t } = useI18n();
	const [confirmLog, setConfirmLog] = useState<UploadLog | null>(null);
	const [errorsLog, setErrorsLog] = useState<UploadLog | null>(null);
	const [rolling, setRolling] = useState(false);

	const handleConfirm = async (log: UploadLog) => {
		const fn = rollbackByUploadType[log.upload_type];
		if (!fn) {
			setConfirmLog(null);
			return;
		}
		setRolling(true);
		try {
			await fn(log.id);
			setConfirmLog(null);
		} finally {
			setRolling(false);
		}
	};

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-semibold text-gray-900">{t('uploadHistory.title')}</h1>
				<p className="mt-1 text-sm text-gray-500">{t('uploadHistory.subtitle')}</p>
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

			{/* The backend does not persist the annotated Excel, so the drawer opens empty from
			    here. It is meant to be reused from the canvas with the freshly-returned blob. */}
			<ErrorsDrawer
				open={errorsLog !== null}
				onClose={() => setErrorsLog(null)}
				excelBase64={null}
			/>
		</div>
	);
}
