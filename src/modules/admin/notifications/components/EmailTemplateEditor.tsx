'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { I18nText } from '@/shared/types';
import { useEmailTemplateMutations, useNotificationCategories } from '../hooks/useEmailTemplates';
import type { CoreType, EmailTemplate, EmailTemplateBody, NotifyVar } from '../types';
import { TemplateFields } from './TemplateFields';
import { ActiveToggle, EditorActions, EditorShell, FormSection } from './shared';
import { localizedTypeName } from './localizedTypeName';

type Props = {
	template: EmailTemplate | null;
	onCancel: () => void;
	onSuccess: (messageKey: string) => void;
	onError: (message: string) => void;
	/** When set, the category is fixed to this id and the selector is hidden. */
	lockedCategoryId?: number | null;
	/** Variables shown alongside the body editor. */
	notifyVars?: NotifyVar[];
	/** Overrides the editor card title (e.g. for the User tab). */
	title?: string;
};

function asI18n(text: I18nText | undefined | null): I18nText {
	return { es: text?.es ?? '', en: text?.en ?? '' };
}

export function EmailTemplateEditor({
	template,
	onCancel,
	onSuccess,
	onError,
	lockedCategoryId = null,
	notifyVars,
	title,
}: Props) {
	const { t, locale } = useI18n();
	const isEditing = template != null;

	const { data: categories = [] } = useNotificationCategories();
	const { save } = useEmailTemplateMutations();

	const [categoryTypeId, setCategoryTypeId] = useState<number | null>(
		template?.categoryTypeId ?? lockedCategoryId ?? null,
	);
	const [code, setCode] = useState(template?.code ?? '');
	const [name, setName] = useState<I18nText>(() => asI18n(template?.name));
	const [subject, setSubject] = useState<I18nText>(() => asI18n(template?.subject));
	const [body, setBody] = useState<I18nText>(() => asI18n(template?.body));
	const [isActive, setIsActive] = useState<boolean>(template?.isActive ?? true);
	const [error, setError] = useState<string | null>(null);

	const saving = save.isPending;

	const categoryOptions = useMemo(
		() =>
			categories.map((category: CoreType) => ({
				value: category.id,
				label: localizedTypeName(category.name, locale, category.code),
			})),
		[categories, locale],
	);

	const selectedCategory =
		categoryOptions.find((option) => option.value === categoryTypeId) ?? null;

	async function handleSubmit() {
		if (categoryTypeId == null || !code.trim()) {
			setError(t('admin.notify.template.error.required'));
			return;
		}
		setError(null);

		const payload: EmailTemplateBody = {
			categoryTypeId,
			code: code.trim(),
			name,
			subject,
			body,
			isActive,
		};

		try {
			await save.mutateAsync({ id: template?.id ?? null, body: payload });
			onSuccess('admin.notify.toast.saved');
		} catch (e) {
			onError(getErrorMessage(e, 'admin.notify.error.saveFailed'));
		}
	}

	const resolvedTitle =
		title ??
		t(
			isEditing ? 'admin.notify.template.form.editTitle' : 'admin.notify.template.form.createTitle',
		);

	return (
		<EditorShell
			title={resolvedTitle}
			onBack={onCancel}
			footer={
				<EditorActions left={<ActiveToggle checked={isActive} onChange={setIsActive} />}>
					{error && <span className="text-sm font-medium text-red-700">{error}</span>}
					<Button variant="secondary" onClick={onCancel}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={saving} onClick={handleSubmit}>
						{saving ? t('loading.default') : t('admin.notify.btn.save')}
					</Button>
				</EditorActions>
			}>
			<FormSection title={t('admin.notify.template.section.identity')}>
				<div className="grid gap-4 sm:grid-cols-2">
					{lockedCategoryId == null && (
						<Select
							name="category"
							label={t('admin.notify.template.field.category')}
							placeholder={t('admin.notify.template.field.categoryPlaceholder')}
							isSearchable
							options={categoryOptions}
							value={selectedCategory}
							onChange={(_name, value) =>
								setCategoryTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
							}
						/>
					)}
					<Input
						label={t('admin.notify.template.field.code')}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						disabled={isEditing}
						required
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
				notifyVars={notifyVars}
				disabled={saving}
			/>
		</EditorShell>
	);
}
