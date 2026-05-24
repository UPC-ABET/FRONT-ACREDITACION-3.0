'use client';

import { useI18n } from '@/providers';
import { Button } from '@/shared/components';
import { VIEW_LABELS } from './viewLabels';
import { TYPE_CODES } from '../../constants';
import type { IFCHeader } from '../../services/types';

const S = TYPE_CODES.IFC_STATUS;

export type ActionFlags = {
	status: string;
	isOwn: boolean;
	inChain: boolean;
	showSubmit: boolean;
	showEdit: boolean;
	showApprove: boolean;
	showReject: boolean;
	showObservation: boolean;
	showBack: boolean;
};

export function computeActionFlags(ifc: IFCHeader, currentUserId: number | null): ActionFlags {
	const status = ifc.status?.code ?? S.UNREGISTERED;
	const isOwn =
		currentUserId != null &&
		ifc.coordinator.user_id != null &&
		Number(ifc.coordinator.user_id) === Number(currentUserId);
	const inChain = ifc.requester_in_chain;

	return {
		status,
		isOwn,
		inChain,
		showSubmit: (status === S.UNREGISTERED || status === S.SAVED) && inChain,
		showEdit: (status === S.SAVED || status === S.OBSERVED) && inChain,
		showApprove: status === S.SUBMITTED && !isOwn,
		showReject: status === S.SUBMITTED && !isOwn,
		showObservation: status === S.SUBMITTED && !isOwn,
		showBack: true,
	};
}

type Props = {
	flags: ActionFlags;
	disabled?: boolean;
	onSubmit: () => void;
	onApprove: () => void;
	onReject: () => void;
	onEdit: () => void;
	onBack: () => void;
};

export function IFCActionButtons({
	flags,
	disabled,
	onSubmit,
	onApprove,
	onReject,
	onEdit,
	onBack,
}: Props) {
	const { locale: lang } = useI18n();

	return (
		<div className="flex flex-wrap items-center justify-end gap-3 pt-2">
			{flags.showBack && (
				<Button variant="secondary" size="lg" onClick={onBack} disabled={disabled}>
					{VIEW_LABELS.btn_back[lang]}
				</Button>
			)}
			{flags.showEdit && (
				<Button variant="surface" size="lg" onClick={onEdit} disabled={disabled}>
					{VIEW_LABELS.btn_edit[lang]}
				</Button>
			)}
			{flags.showReject && (
				<Button variant="warning" size="lg" onClick={onReject} disabled={disabled}>
					{VIEW_LABELS.btn_reject[lang]}
				</Button>
			)}
			{flags.showApprove && (
				<Button variant="primary" size="lg" onClick={onApprove} disabled={disabled}>
					{VIEW_LABELS.btn_approve[lang]}
				</Button>
			)}
			{flags.showSubmit && (
				<Button variant="primary" size="lg" onClick={onSubmit} disabled={disabled}>
					{VIEW_LABELS.btn_submit[lang]}
				</Button>
			)}
		</div>
	);
}
