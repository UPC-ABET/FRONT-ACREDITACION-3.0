'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorDialog, LoadingDialog, SuccessDialog } from '@/shared/components';
import { useI18n } from '@/providers';
import { useIFCView } from '../../hooks/useIFCView';
import { approveIFC, rejectIFC, submitIFC } from '../../services/ifcsService';
import { IFCHeaderCard } from './IFCHeaderCard';
import { IFCInformationBlock } from './IFCInformationBlock';
import { IFCResultadoLogros } from '../shared/IFCResultadoLogros';
import { IFCResultadoAlcanzado } from '../shared/IFCResultadoAlcanzado';
import { PreviousActionsTable } from '../shared/PreviousActionsTable';
import { SubmitConfirmModal } from '../shared/SubmitConfirmModal';
import { IFCFindingsTable } from './IFCFindingsTable';
import { IFCActionsTable } from './IFCActionsTable';
import { IFCActionButtons, computeActionFlags } from './IFCActionButtons';

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

export default function IFCViewPage() {
	const { t, locale: lang } = useI18n();
	const router = useRouter();
	const params = useParams<{ id: string }>();
	const id = Number(params?.id);

	const { data, loading, error, refetch } = useIFCView(id);
	const [observationText, setObservationText] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [submitModalOpen, setSubmitModalOpen] = useState(false);

	const currentUserId = useMemo(() => {
		if (typeof window === 'undefined') return null;
		try {
			const raw = localStorage.getItem('token');
			const user = raw ? JSON.parse(raw) : null;
			return user?.id != null ? Number(user.id) : null;
		} catch {
			return null;
		}
	}, []);

	if (loading) {
		return <LoadingDialog isOpen label={t('loading.default')} />;
	}

	if (error || !data) {
		return (
			<ErrorDialog
				isOpen
				onClose={() => router.push('/ifcs')}
				message={tryTranslate(t, error ?? 'ifcs.error.viewFailed')}
			/>
		);
	}

	const ifc = data.ifc;
	const flags = computeActionFlags(ifc, currentUserId);

	async function runAction(fn: () => Promise<void>, successKey: string) {
		setSubmitting(true);
		setActionError(null);
		try {
			await fn();
			setSuccessMsg(t(successKey));
			await refetch();
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcs.error.generic';
			setActionError(message);
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
			} else if (res.notification.reason === 'no_config') {
				setSuccessMsg(t('ifcs.submit.toast.successNoConfig'));
			} else {
				setSuccessMsg(t('ifcs.submit.toast.successNoNotify'));
			}
			await refetch();
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcs.error.generic';
			setActionError(message);
		} finally {
			setSubmitting(false);
		}
	}

	function handleApprove() {
		void runAction(() => approveIFC(id), 'ifcs.view.toast.approved');
	}

	function handleReject() {
		if (observationText.trim() === '') {
			setActionError('ifcs.view.rejectEmpty');
			return;
		}
		void runAction(
			() => rejectIFC(id, { [lang]: observationText.trim() }),
			'ifcs.view.toast.rejected',
		);
	}

	function handleEdit() {
		router.push(`/ifcs/${id}/edit`);
	}

	function handleBack() {
		router.push('/ifcs');
	}

	return (
		<div className="w-full space-y-8">
			<IFCHeaderCard
				ifc={ifc}
				showObservation={flags.showObservation}
				observationText={observationText}
				onObservationChange={setObservationText}
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<IFCResultadoLogros outcomeResult={data.outcome_course_result} />
				<IFCResultadoAlcanzado learningOutcome={ifc.course_learning_outcome} />
			</div>

			<IFCInformationBlock information={ifc.information} />

			<PreviousActionsTable previousActions={data.previous_actions} />

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
				<ErrorDialog
					isOpen
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
