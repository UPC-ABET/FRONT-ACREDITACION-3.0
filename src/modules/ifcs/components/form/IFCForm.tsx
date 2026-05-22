'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/providers';
import { Button, Card, ErrorDialog, LoadingDialog, SuccessDialog } from '@/shared/components';
import { useIFCFormState } from '../../hooks/useIFCFormState';
import { createIFC, patchIFC } from '../../services/ifcsService';
import type {
	CriticalityOption,
	I18nText,
	IFCField,
	IFCPrefill,
	IFCViewPayload,
} from '../../services/types';
import { IFCPageTitle } from '../shared/IFCPageTitle';
import { IFCResultadoAlcanzado } from '../shared/IFCResultadoAlcanzado';
import { IFCResultadoLogros } from '../shared/IFCResultadoLogros';
import { PreviousActionsTable } from '../shared/PreviousActionsTable';
import { SubmitConfirmModal } from '../shared/SubmitConfirmModal';
import { FORM_LABELS } from './formLabels';
import { IFCActionsEditor } from './IFCActionsEditor';
import { IFCFindingsEditor } from './IFCFindingsEditor';
import { IFCInformationFields } from './IFCInformationFields';

type Props = {
	mode: 'create' | 'edit';
	chartId?: number;
	periodId?: number;
	existing: IFCViewPayload | null;
	prefill: IFCPrefill;
	languages: string[];
	ifcFields: IFCField[];
	criticalities: CriticalityOption[];
};

function hasAnyLang(value: I18nText | undefined, languages: string[]): boolean {
	if (!value) return false;
	return languages.some((l) => value[l]?.trim());
}

function tryTranslate(t: (k: string) => string, key: string) {
	const translated = t(key);
	return translated === key ? key : translated;
}

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
	} = useIFCFormState(props.existing);

	const [submitting, setSubmitting] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMsg, setSuccessMsg] = useState<string | null>(null);
	const [pendingNavId, setPendingNavId] = useState<number | null>(null);

	function validate(): string | null {
		const missingRequired = props.ifcFields
			.filter((f) => f.required)
			.some((f) => !hasAnyLang(state.information[f.key], props.languages));
		if (missingRequired) return 'ifcs.form.err.requiredFields';

		const findingInvalid = state.findings.some(
			(f) => !hasAnyLang(f.description, props.languages) || !f.criticality_code,
		);
		if (findingInvalid) return 'ifcs.form.err.findingIncomplete';

		const actionInvalid = state.actions.some(
			(a) => !hasAnyLang(a.description, props.languages) || !a.finding_temp_id,
		);
		if (actionInvalid) return 'ifcs.form.err.actionIncomplete';

		return null;
	}

	async function onSave(submit: boolean) {
		const err = validate();
		if (err) {
			setError(err);
			return;
		}
		setSubmitting(true);
		setError(null);

		const findingsPayload = state.findings.map((f) => ({
			tempId: f.tempId,
			id: f.id,
			description: f.description,
			criticality_code: f.criticality_code,
		}));
		const actionsPayload = state.actions.map((a) => ({
			tempId: a.tempId,
			id: a.id,
			description: a.description,
			finding_temp_id: a.finding_temp_id,
		}));

		try {
			const result =
				props.mode === 'create'
					? await createIFC({
							chart_id: props.chartId!,
							period_id: props.periodId!,
							submit,
							information: state.information,
							findings: findingsPayload,
							actions: actionsPayload,
						})
					: await patchIFC(props.existing!.ifc.id, {
							submit,
							information: state.information,
							findings: findingsPayload,
							actions: actionsPayload,
							deleted_finding_ids: state.deleted_finding_ids,
							deleted_action_ids: state.deleted_action_ids,
						});

			if (submit) {
				const n = result.notification;
				if (n.sent) {
					setSuccessMsg(t('ifcs.submit.toast.successWithNotify'));
				} else if (n.reason === 'no_config') {
					setSuccessMsg(t('ifcs.submit.toast.successNoConfig'));
				} else {
					setSuccessMsg(t('ifcs.submit.toast.successNoNotify'));
				}
				setPendingNavId(result.id);
			} else {
				router.push(`/ifcs/${result.id}`);
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : 'ifcs.error.saveFailed';
			setError(message);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="w-full space-y-8">
			<Card>
				<div className="space-y-4">
					<IFCPageTitle
						area={props.prefill.area_label}
						subarea={props.prefill.subarea_label}
						course={props.prefill.course_name}
						period={props.prefill.academic_period_code}
					/>
					<div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
						<p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
							{FORM_LABELS.coordinator[lang]}
						</p>
						<p className="mt-1.5 text-base text-zinc-900">
							{props.prefill.coordinator_name ?? '—'}
							{props.prefill.coordinator_code && (
								<> ({props.prefill.coordinator_code})</>
							)}
						</p>
					</div>
				</div>
			</Card>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<IFCResultadoLogros outcomeResult={props.prefill.outcome_course_result} />
				<IFCResultadoAlcanzado learningOutcome={props.prefill.course_learning_outcome} />
			</div>

			{props.ifcFields.length > 0 && (
				<Card>
					<IFCInformationFields
						fields={props.ifcFields}
						languages={props.languages}
						values={state.information}
						onChange={setInformation}
					/>
				</Card>
			)}

			<PreviousActionsTable previousActions={props.prefill.previous_actions} />

			<IFCFindingsEditor
				findings={state.findings}
				languages={props.languages}
				criticalities={props.criticalities}
				onAdd={addFinding}
				onUpdate={updateFinding}
				onDelete={deleteFinding}
			/>

			<IFCActionsEditor
				actions={state.actions}
				findings={state.findings}
				languages={props.languages}
				onAdd={addAction}
				onUpdate={updateAction}
				onDelete={deleteAction}
			/>

			<div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap justify-end gap-3 border-t border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur sm:relative sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
				<Button variant="ghost" size="lg" onClick={() => router.back()}>
					{FORM_LABELS.btn_cancel[lang]}
				</Button>
				<Button variant="secondary" size="lg" onClick={() => void onSave(false)}>
					{FORM_LABELS.btn_save[lang]}
				</Button>
				<Button variant="primary" size="lg" onClick={() => setModalOpen(true)}>
					{FORM_LABELS.btn_submit[lang]}
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
				<ErrorDialog isOpen onClose={() => setError(null)} message={tryTranslate(t, error)} />
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
