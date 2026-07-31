'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers';
import { Button, Card, LoadingDialog, PageHeader, SuccessDialog, Toast } from '@/shared/components';
import {
	resolveApiErrorContent,
	tryTranslateReason,
	type ApiErrorContent,
} from '@/shared/utils/tryTranslate';
import { useIFCFormState } from '../../hooks/useIFCFormState';
import { validateIFCForm } from '../../schemas';
import { createIFC, patchIFC } from '../../services/ifcsService';
import type { CriticalityOption, IFCField, IFCPrefill, IFCViewPayload } from '../../types';
import { IFCLearningOutcomeReached } from '../shared/IFCLearningOutcomeReached';
import { IFCOutcomeResults } from '../shared/IFCOutcomeResults';
import { PreviousActionsTable } from '../shared/PreviousActionsTable';
import { SubmitConfirmModal } from '../shared/SubmitConfirmModal';
import { IFCActionsEditor } from './IFCActionsEditor';
import { IFCFindingsEditor } from './IFCFindingsEditor';
import { IFCInformationFields } from './IFCInformationFields';

type Props = {
	mode: 'create' | 'edit';
	chartId?: number;
	existing: IFCViewPayload | null;
	prefill: IFCPrefill;
	languages: string[];
	ifcFields: IFCField[];
	criticalities: CriticalityOption[];
};

export function IFCForm(props: Props) {
	const { t, locale: lang } = useI18n();
	const router = useRouter();
	const {
		state,
		addFinding,
		updateFinding,
		deleteFinding,
		addAction,
		updateAction,
		deleteAction,
		setInformation,
		updatePreviousActionEvidence,
	} = useIFCFormState(props.existing, props.prefill.previousActions);

	const [submitting, setSubmitting] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [error, setError] = useState<ApiErrorContent | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [pendingNavId, setPendingNavId] = useState<number | null>(null);

	async function onSave(submit: boolean) {
		const validationError = validateIFCForm(state, props.ifcFields, props.languages);
		if (validationError) {
			setError({ title: tryTranslateReason(t, validationError), reasons: [] });
			return;
		}
		setSubmitting(true);
		setError(null);

		const findingsPayload = state.findings.map((f) => ({
			tempId: f.tempId,
			id: f.id,
			description: f.description,
			criticalityCode: f.criticalityCode,
		}));
		const actionsPayload = state.actions.map((a) => ({
			tempId: a.tempId,
			id: a.id,
			description: a.description,
			findingTempId: a.findingTempId,
		}));
		const previousActionsPayload = Object.entries(state.previousActions).map(
			([findingActionId, evidences]) => ({
				findingActionId: Number(findingActionId),
				evidences,
			}),
		);

		try {
			const result =
				props.mode === 'create'
					? await createIFC({
							chartId: props.chartId!,
							submit,
							information: state.information,
							findings: findingsPayload,
							actions: actionsPayload,
							previousActions: previousActionsPayload,
						})
					: await patchIFC(props.existing!.ifc.id, {
							submit,
							information: state.information,
							findings: findingsPayload,
							actions: actionsPayload,
							deletedFindingIds: state.deletedFindingIds,
							deletedActionIds: state.deletedActionIds,
							previousActions: previousActionsPayload,
						});

			if (submit) {
				const n = result.notification;
				if (n.sent) {
					setSuccessMsg(t('ifcs.submit.toast.successWithNotify'));
				} else if (n.reason === 'noConfig') {
					setSuccessMsg(t('ifcs.submit.toast.successNoConfig'));
				} else {
					setSuccessMsg(t('ifcs.submit.toast.successNoNotify'));
				}
				setPendingNavId(result.id);
			} else {
				router.push(`/ifcs/${result.id}`);
			}
		} catch (e) {
			setError(resolveApiErrorContent(t, e, 'ifcs.error.saveFailed'));
		} finally {
			setSubmitting(false);
		}
	}

	const courseName = props.prefill.courseName?.[lang] ?? '';
	const crumbs = [
		props.prefill.areaLabel?.[lang] ?? '',
		props.prefill.subareaLabel?.[lang] ?? '',
		props.prefill.academicPeriodCode,
	]
		.filter(Boolean)
		.join(' - ');

	return (
		<div className="space-y-6">
			<PageHeader title={courseName || '-'} description={crumbs || undefined} />

			<Card>
				<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
					<p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
						{t('ifcs.form.coordinator')}
					</p>
					<p className="mt-1.5 text-base text-zinc-900">
						{props.prefill.coordinatorName ?? '—'}
						{props.prefill.coordinatorCode && <> ({props.prefill.coordinatorCode})</>}
					</p>
				</div>
			</Card>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<IFCOutcomeResults outcomeResult={props.prefill.outcomeCourseResult} />
				<IFCLearningOutcomeReached learningOutcome={props.prefill.courseLearningOutcome} />
			</div>

			{props.ifcFields.length > 0 && (
				<Card>
					<IFCInformationFields
						fields={props.ifcFields}
						values={state.information}
						onChange={setInformation}
					/>
				</Card>
			)}

			<PreviousActionsTable
				previousActions={props.prefill.previousActions}
				mode="edit"
				evidencesByActionId={state.previousActions}
				onEvidenceChange={updatePreviousActionEvidence}
			/>

			<Card>
				<IFCFindingsEditor
					findings={state.findings}
					criticalities={props.criticalities}
					onAdd={addFinding}
					onUpdate={updateFinding}
					onDelete={deleteFinding}
				/>
			</Card>

			<Card>
				<IFCActionsEditor
					actions={state.actions}
					findings={state.findings}
					onAdd={addAction}
					onUpdate={updateAction}
					onDelete={deleteAction}
				/>
			</Card>

			<div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-3 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur sm:relative sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
				<Button variant="ghost" size="lg" onClick={() => router.back()}>
					{t('ifcs.form.btn.cancel')}
				</Button>
				<Button variant="secondary" size="lg" onClick={() => void onSave(false)}>
					{t('ifcs.form.btn.save')}
				</Button>
				<Button variant="primary" size="lg" onClick={() => setModalOpen(true)}>
					{t('ifcs.form.btn.submit')}
				</Button>
			</div>

			<SubmitConfirmModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				onSaveInstead={() => {
					setModalOpen(false);
					void onSave(false);
				}}
				onConfirm={() => {
					setModalOpen(false);
					void onSave(true);
				}}
			/>

			{submitting && <LoadingDialog isOpen label={t('loading.default')} />}
			{error && (
				<Toast
					isOpen
					type="error"
					onClose={() => setError(null)}
					message={error.title}
					reasons={error.reasons}
				/>
			)}
			{successMsg && (
				<SuccessDialog
					isOpen
					onClose={() => {
						setSuccessMsg(null);
						if (pendingNavId != null) {
							const target = pendingNavId;
							setPendingNavId(null);
							router.push(`/ifcs/${target}`);
						}
					}}
					message={successMsg}
				/>
			)}
		</div>
	);
}
