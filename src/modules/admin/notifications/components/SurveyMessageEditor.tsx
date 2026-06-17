'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { I18nText } from '@/shared/types';
import {
	useSurveyMessageMutations,
	useSurveyNotifyVars,
	useSurveyTypes,
} from '../hooks/useSurveyMessages';
import type { CoreType, SurveyMessage, SurveyMessageBody } from '../types';
import { TemplateFields } from './TemplateFields';
import { ActiveToggle, EditorActions, EditorShell, FormSection } from './shared';
import { localizedTypeName } from './localizedTypeName';

type Props = {
	message: SurveyMessage | null;
	onCancel: () => void;
	onSuccess: (messageKey: string) => void;
	onError: (message: string) => void;
};

function asI18n(text: I18nText | undefined | null): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

function parseCcReceivers(value: unknown): string {
	if (Array.isArray(value)) return value.join(', ');
	if (typeof value === 'string') return value;
	return '';
}

export function SurveyMessageEditor({ message, onCancel, onSuccess, onError }: Props) {
	const { t, locale } = useI18n();
	const isEditing = message != null;

	const { data: surveyTypes = [] } = useSurveyTypes();
	const { data: surveyVars = [] } = useSurveyNotifyVars();
	const { save } = useSurveyMessageMutations();

	const [surveyTypeId, setSurveyTypeId] = useState<number | null>(message?.surveyTypeId ?? null);
	const [name, setName] = useState<I18nText>(() => asI18n(message?.name));
	const [subject, setSubject] = useState<I18nText>(() => asI18n(message?.subject));
	const [body, setBody] = useState<I18nText>(() => asI18n(message?.body));
	const [ccReceivers, setCcReceivers] = useState<string>(() =>
		parseCcReceivers(message?.ccReceivers),
	);
	const [isActive, setIsActive] = useState<boolean>(message?.isActive ?? true);
	const [error, setError] = useState<string | null>(null);

	const saving = save.isPending;

	const surveyTypeOptions = useMemo(
		() =>
			surveyTypes.map((type: CoreType) => ({
				value: type.id,
				label: localizedTypeName(type.name, locale, type.code),
			})),
		[surveyTypes, locale],
	);

	const selectedSurveyType =
		surveyTypeOptions.find((option) => option.value === surveyTypeId) ?? null;

	async function handleSubmit() {
		if (surveyTypeId == null) {
			setError(t('admin.notify.survey.error.required'));
			return;
		}
		setError(null);

		const ccList = ccReceivers
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean);

		const payload: SurveyMessageBody = {
			surveyTypeId,
			name,
			subject,
			body,
			isActive,
			...(ccList.length > 0 ? { ccReceivers: ccList } : {}),
		};

		try {
			await save.mutateAsync({ id: message?.id ?? null, body: payload });
			onSuccess('admin.notify.toast.saved');
		} catch (e) {
			onError(getErrorMessage(e, 'admin.notify.error.saveFailed'));
		}
	}

	return (
		<EditorShell
			title={t(
				isEditing ? 'admin.notify.survey.form.editTitle' : 'admin.notify.survey.form.createTitle',
			)}
			onBack={onCancel}
			footer={
				<EditorActions left={<ActiveToggle checked={isActive} onChange={setIsActive} />}>
					{error && <span className="text-sm font-medium text-red-700">{error}</span>}
					<Button variant="secondary" onClick={onCancel}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={saving} onClick={handleSubmit} loading={saving}>
						{t('admin.notify.btn.save')}
					</Button>
				</EditorActions>
			}>
			<FormSection title={t('admin.notify.survey.section.target')}>
				<div className="grid gap-4 sm:grid-cols-2">
					<Select
						name="surveyType"
						label={t('admin.notify.survey.field.surveyType')}
						placeholder={t('admin.notify.survey.field.surveyTypePlaceholder')}
						isSearchable
						options={surveyTypeOptions}
						value={selectedSurveyType}
						onChange={(_name, value) =>
							setSurveyTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>
				</div>
			</FormSection>

			<TemplateFields
				name={name}
				subject={subject}
				body={body}
				onName={setName}
				onSubject={setSubject}
				onBody={setBody}
				notifyVars={surveyVars}
				disabled={saving}
			/>

			<FormSection title={t('admin.notify.survey.field.ccReceivers')}>
				<Input
					value={ccReceivers}
					onChange={(event) => setCcReceivers(event.target.value)}
					placeholder={t('admin.notify.survey.field.ccReceiversPlaceholder')}
				/>
			</FormSection>
		</EditorShell>
	);
}
