'use client';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components';
import { useI18n } from '@/providers';
import { interpolate } from '@/shared/utils';
import type { UploadLog } from '../types';

interface RollbackConfirmDialogProps {
	log: UploadLog | null;
	open: boolean;
	onClose: () => void;
	onConfirm: (log: UploadLog) => Promise<void>;
	loading?: boolean;
}

export default function RollbackConfirmDialog({
	log,
	open,
	onClose,
	onConfirm,
	loading,
}: RollbackConfirmDialogProps) {
	const { t } = useI18n();
	if (!log) return null;

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o && !loading) onClose();
			}}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t('uploadHistory.rollback.title')}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
						⚠️{' '}
						{interpolate(t('uploadHistory.rollback.warning'), {
							type: log.upload_type,
							id: String(log.id),
						})}
					</div>
					<p className="text-sm text-gray-600">{t('uploadHistory.rollback.confirmation')}</p>
					<div className="flex justify-end gap-2">
						<Button variant="secondary" onClick={onClose} disabled={loading}>
							{t('uploadHistory.rollback.cancel')}
						</Button>
						<Button variant="primary" onClick={() => onConfirm(log)} disabled={loading}>
							{loading ? t('uploadHistory.rollback.running') : t('uploadHistory.rollback.confirm')}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
