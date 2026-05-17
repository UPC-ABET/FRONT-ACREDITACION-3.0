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

	function confirmSubmit() {
		setSubmitModalOpen(false);
		void runAction(() => submitIFC(id), 'ifcs.view.toast.submitted');
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
		<div className="space-y-8">
			<IFCHeaderCard
				ifc={ifc}
				showObservation={flags.showObservation}
				observationText={observationText}
				onObservationChange={setObservationText}
			/>

			<IFCResultadoLogros outcomeResult={data.outcome_course_result} />
			<IFCResultadoAlcanzado learningOutcome={ifc.course_learning_outcome} />

			<IFCInformationBlock information={ifc.information} />

			<IFCFindingsTable findings={data.findings} />
			<IFCActionsTable findings={data.findings} />

			<IFCActionButtons
				flags={flags}
				disabled={submitting}
				onSubmit={handleSubmit}
				onApprove={handleApprove}
				onReject={handleReject}
				onEdit={handleEdit}
				onBack={handleBack}
			/>

			<SubmitConfirmModal
				isOpen={submitModalOpen}
				onClose={() => setSubmitModalOpen(false)}
				onConfirm={confirmSubmit}
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
