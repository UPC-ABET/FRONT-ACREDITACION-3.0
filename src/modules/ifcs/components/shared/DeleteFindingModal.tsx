'use client';

import { ConfirmDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { CONSULT_LABELS } from '../consult/consultLabels';

type Props = {
	target: { id: number } | null;
	onConfirm: () => Promise<void> | void;
	onClose: () => void;
	submitting: boolean;
};

export function DeleteFindingModal({ target, onConfirm, onClose, submitting }: Props) {
	const { locale: lang } = useI18n();

	return (
		<ConfirmDialog
			isOpen={target !== null}
			onClose={onClose}
			title={CONSULT_LABELS.deleteModalTitle[lang]}
			message={CONSULT_LABELS.deleteModalBody[lang]}
			onConfirm={onConfirm}
			confirmLabel={CONSULT_LABELS.deleteModalConfirm[lang]}
			declineLabel={CONSULT_LABELS.deleteModalCancel[lang]}
			onDecline={onClose}
			isLoading={submitting}
		/>
	);
}
