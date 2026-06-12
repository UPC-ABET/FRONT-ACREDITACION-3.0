'use client';

import { I18nTextField } from '@/shared/components';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import type { NotifyVar } from '../types';
import { FormSection } from './shared';
import { VariableLegend } from './VariableLegend';

type Props = {
	name: I18nText;
	subject: I18nText;
	body: I18nText;
	onName: (value: I18nText) => void;
	onSubject: (value: I18nText) => void;
	onBody: (value: I18nText) => void;
	notifyVars?: NotifyVar[];
	/** Gates which variables are shown (IFC variables can be status-specific). */
	statusCode?: string | null;
	disabled?: boolean;
};

export function TemplateFields({
	name,
	subject,
	body,
	onName,
	onSubject,
	onBody,
	notifyVars,
	statusCode = null,
	disabled,
}: Props) {
	const { t } = useI18n();

	return (
		<div className="space-y-8">
			<FormSection title={t('admin.notify.field.name')}>
				<I18nTextField as="input" layout="row" value={name} onChange={onName} disabled={disabled} />
			</FormSection>

			<FormSection title={t('admin.notify.field.subject')}>
				<I18nTextField
					as="input"
					layout="row"
					value={subject}
					onChange={onSubject}
					disabled={disabled}
				/>
			</FormSection>

			<FormSection title={t('admin.notify.field.body')}>
				<div className="grid gap-5 lg:grid-cols-[1fr_320px]">
					<I18nTextField
						layout="row"
						rows={10}
						value={body}
						onChange={onBody}
						disabled={disabled}
					/>
					{notifyVars && notifyVars.length > 0 && (
						<VariableLegend notifyVars={notifyVars} currentStatusCode={statusCode} />
					)}
				</div>
			</FormSection>
		</div>
	);
}
