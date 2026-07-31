'use client';

import { ConfirmDialog } from '@/shared/components';
import { useI18n } from '@/providers';

type Props = {
	target: { id: number } | null;
	onConfirm: () => Promise<void> | void;
	onClose: () => void;
	submitting: boolean;
};

export function DeleteFindingModal({ target, onConfirm, onClose, submitting }: Props) {
	const { t } = useI18n();

	return (
		<ConfirmDialog
			isOpen={target !== null}
			onClose={onClose}
			title={t('ifcFindings.deleteModal.title')}
			message={t('ifcFindings.deleteModal.body')}
			onConfirm={onConfirm}
			confirmLabel={t('ifcFindings.deleteModal.confirm')}
			declineLabel={t('ifcFindings.deleteModal.cancel')}
			onDecline={onClose}
			isLoading={submitting}
		/>
	);
}
