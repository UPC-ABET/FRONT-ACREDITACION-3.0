'use client';

import { useI18n } from '@/providers';
import { Button } from '@/shared/components';
import { TYPE_CODES } from '@/shared/constants';
import type { IFCHeader } from '../../types';

const S = TYPE_CODES.IFC_STATUS;

export type ActionFlags = {
	status: string;
	inChain: boolean;
	hasHigherLevel: boolean;
	showSubmit: boolean;
	showEdit: boolean;
	showApprove: boolean;
	showReject: boolean;
	showObservation: boolean;
	showBack: boolean;
};

export function computeActionFlags(ifc: IFCHeader): ActionFlags {
	const status = ifc.status?.code ?? S.UNREGISTERED;
	const inChain = ifc.requesterInChain;
	const hasHigherLevel = ifc.requesterHasHigherLevel;

	return {
		status,
		inChain,
		hasHigherLevel,
		showSubmit: (status === S.UNREGISTERED || status === S.SAVED) && inChain,
		showEdit: (status === S.SAVED || status === S.OBSERVED) && inChain,
		showApprove: status === S.SUBMITTED && hasHigherLevel,
		showReject: status === S.SUBMITTED && hasHigherLevel,
		showObservation: status === S.SUBMITTED && hasHigherLevel,
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
	const { t } = useI18n();

	return (
		<div className="flex flex-wrap items-center justify-end gap-3 pt-2">
			{flags.showBack && (
				<Button variant="secondary" size="lg" onClick={onBack} disabled={disabled}>
					{t('ifcs.view.btn.back')}
				</Button>
			)}
			{flags.showEdit && (
				<Button variant="surface" size="lg" onClick={onEdit} disabled={disabled}>
					{t('ifcs.view.btn.edit')}
				</Button>
			)}
			{flags.showReject && (
				<Button variant="warning" size="lg" onClick={onReject} disabled={disabled}>
					{t('ifcs.view.btn.reject')}
				</Button>
			)}
			{flags.showApprove && (
				<Button variant="primary" size="lg" onClick={onApprove} disabled={disabled}>
					{t('ifcs.view.btn.approve')}
				</Button>
			)}
			{flags.showSubmit && (
				<Button variant="primary" size="lg" onClick={onSubmit} disabled={disabled}>
					{t('ifcs.view.btn.submit')}
				</Button>
			)}
		</div>
	);
}
