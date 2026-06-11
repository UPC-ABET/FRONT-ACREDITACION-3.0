'use client';

import { useI18n } from '@/providers';
import { ConfirmDialog } from '@/shared/components';

type Props = {
	isOpen: boolean;
	onConfirm: () => void;
	onClose: () => void;
	onSaveInstead?: () => void;
};

export function SubmitConfirmModal({ isOpen, onConfirm, onClose, onSaveInstead }: Props) {
	const { t } = useI18n();
	return (
		<ConfirmDialog
			isOpen={isOpen}
			onClose={onClose}
			title={t('ifcs.submit.modal.title')}
			message={t('ifcs.submit.modal.body')}
			onConfirm={onConfirm}
			confirmLabel={t('ifcs.submit.modal.confirm')}
			onDecline={onSaveInstead}
			declineLabel={onSaveInstead ? t('ifcs.submit.modal.saveInstead') : undefined}
		/>
	);
}
