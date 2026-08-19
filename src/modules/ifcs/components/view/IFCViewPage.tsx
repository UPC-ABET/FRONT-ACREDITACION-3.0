'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorDialog, LoadingDialog, SuccessDialog, Toast } from '@/shared/components';
import { useGlobalAcademicFiltersLockOverride, useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useIFCView } from '../../hooks/useIfcs';
import { approveIFC, rejectIFC, submitIFC } from '../../services/ifcsService';
import type { I18nText } from '../../types';
import { IFCHeaderCard } from './IFCHeaderCard';
import { IFCInformationBlock } from './IFCInformationBlock';
import { IFCOutcomeResults } from '../shared/IFCOutcomeResults';
import { IFCLearningOutcomeReached } from '../shared/IFCLearningOutcomeReached';
import { PreviousActionsTable } from '../shared/PreviousActionsTable';
import { SubmitConfirmModal } from '../shared/SubmitConfirmModal';
import { IFCFindingsTable } from './IFCFindingsTable';
import { IFCActionsTable } from './IFCActionsTable';
import { IFCActionButtons, computeActionFlags } from './IFCActionButtons';

export default function IFCViewPage() {
	const { t } = useI18n();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params?.id);

	useGlobalAcademicFiltersLockOverride({ school: true, modality: true, period: true });

	const { data, isLoading, error, refetch } = useIFCView(id);
	const [observationText, setObservationText] = useState<I18nText>({});
	const [submitting, setSubmitting] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [submitModalOpen, setSubmitModalOpen] = useState(false);

	if (isLoading) {
		return <LoadingDialog isOpen label={t('loading.default')} />;
	}

	if (error || !data) {
		return (
			<ErrorDialog
				isOpen
				onClose={() => router.push('/ifcs')}
				message={tryTranslate(t, getErrorMessage(error, 'ifcs.error.viewFailed'))}
			/>
		);
	}

	const ifc = data.ifc;
	const flags = computeActionFlags(ifc);

	async function runAction(fn: () => Promise<void>, successKey: string) {
		setSubmitting(true);
		setActionError(null);
		try {
			await fn();
			setSuccessMsg(t(successKey));
			await refetch();
		} catch (e) {
			setActionError(getErrorMessage(e, 'ifcs.error.generic'));
		} finally {
			setSubmitting(false);
		}
	}

	function handleSubmit() {
		setSubmitModalOpen(true);
	}

	async function confirmSubmit() {
		setSubmitModalOpen(false);
		setSubmitting(true);
		setActionError(null);
		try {
			const res = await submitIFC(id);
			if (res.notification.sent) {
				setSuccessMsg(t('ifcs.submit.toast.successWithNotify'));
			} else if (res.notification.reason === 'noConfig') {
				setSuccessMsg(t('ifcs.submit.toast.successNoConfig'));
			} else {
				setSuccessMsg(t('ifcs.submit.toast.successNoNotify'));
			}
			await refetch();
		} catch (e) {
			setActionError(getErrorMessage(e, 'ifcs.error.generic'));
		} finally {
			setSubmitting(false);
		}
	}

	function handleApprove() {
		void runAction(() => approveIFC(id), 'ifcs.view.toast.approved');
	}

	function handleReject() {
		const trimmed: I18nText = Object.fromEntries(
			Object.entries(observationText)
				.map(([k, v]) => [k, v.trim()])
				.filter(([, v]) => v !== ''),
		);
		if (Object.keys(trimmed).length === 0) {
			setActionError('ifcs.view.rejectEmpty');
			return;
		}
		void runAction(() => rejectIFC(id, trimmed), 'ifcs.view.toast.rejected');
	}

	function handleEdit() {
		router.push(`/ifcs/${id}/edit`);
	}

	function handleBack() {
		router.push('/ifcs');
	}

	function handleHistory() {
		router.push(`/ifcs/${id}/history`);
	}

	return (
		<div className="space-y-6">
			<IFCHeaderCard
				ifc={ifc}
				showObservation={flags.showObservation}
				observationText={observationText}
				onObservationChange={setObservationText}
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<IFCOutcomeResults outcomeResult={data.outcomeCourseResult} />
				<IFCLearningOutcomeReached learningOutcome={ifc.courseLearningOutcome} />
			</div>

			<IFCInformationBlock information={ifc.information} />

			<PreviousActionsTable previousActions={data.previousActions} mode="view" />

			<IFCFindingsTable findings={data.findings} />
			<IFCActionsTable findings={data.findings} />

			<div className="sticky bottom-0 z-10 -mx-4 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur sm:relative sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
				<IFCActionButtons
					flags={flags}
					disabled={submitting}
					onSubmit={handleSubmit}
					onApprove={handleApprove}
					onReject={handleReject}
					onEdit={handleEdit}
					onBack={handleBack}
					onHistory={handleHistory}
				/>
			</div>

			<SubmitConfirmModal
				isOpen={submitModalOpen}
				onClose={() => setSubmitModalOpen(false)}
				onConfirm={() => {
					void confirmSubmit();
				}}
			/>

			{actionError && (
				<Toast
					isOpen
					type="error"
					onClose={() => setActionError(null)}
					message={tryTranslate(t, actionError)}
				/>
			)}
			{successMsg && (
				<SuccessDialog isOpen onClose={() => setSuccessMsg(null)} message={successMsg} />
			)}
			{submitting && <LoadingDialog isOpen label={t('loading.default')} />}
		</div>
	);
}
