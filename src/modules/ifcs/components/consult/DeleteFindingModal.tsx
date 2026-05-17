'use client';

import { ConfirmDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import type { FindingRow } from '../../services/types';
import { CONSULT_LABELS } from './consultLabels';

type Props = {
	target: FindingRow | null;
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
			title={CONSULT_LABELS.delete_modal_title[lang]}
			message={CONSULT_LABELS.delete_modal_body[lang]}
			onConfirm={onConfirm}
			confirmLabel={CONSULT_LABELS.delete_modal_confirm[lang]}
			declineLabel={CONSULT_LABELS.delete_modal_cancel[lang]}
			onDecline={onClose}
			isLoading={submitting}
		/>
	);
}
