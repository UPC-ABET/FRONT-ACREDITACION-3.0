'use client';

import { I18nTextField } from '@/shared/components';
import { useI18n } from '@/providers';
import type { I18nText } from '@/shared/types';
import type { NotifyVar } from '../types';
import { VariableLegend } from './VariableLegend';

type Props = {
	name: I18nText;
	subject: I18nText;
	body: I18nText;
	onName: (value: I18nText) => void;
	onSubject: (value: I18nText) => void;
	onBody: (value: I18nText) => void;
	notifyVars?: NotifyVar[];
	disabled?: boolean;
};

const headingClass = 'text-lg font-bold uppercase tracking-wider text-zinc-900';

export function TemplateFields({
	name,
	subject,
	body,
	onName,
	onSubject,
	onBody,
	notifyVars,
	disabled,
}: Props) {
	const { t } = useI18n();

	return (
		<div className="space-y-8">
			<section className="space-y-4">
				<h3 className={headingClass}>{t('admin.notify.field.name')}</h3>
				<I18nTextField as="input" layout="row" value={name} onChange={onName} disabled={disabled} />
			</section>

			<section className="space-y-4">
				<h3 className={headingClass}>{t('admin.notify.field.subject')}</h3>
				<I18nTextField
					as="input"
					layout="row"
					value={subject}
					onChange={onSubject}
					disabled={disabled}
				/>
			</section>

			<section className="space-y-4">
				<h3 className={headingClass}>{t('admin.notify.field.body')}</h3>
				<div className="grid gap-5 lg:grid-cols-[1fr_320px]">
					<I18nTextField
						layout="row"
						rows={10}
						value={body}
						onChange={onBody}
						disabled={disabled}
					/>
					{notifyVars && notifyVars.length > 0 && (
						<VariableLegend notifyVars={notifyVars} currentStatusCode={null} />
					)}
				</div>
			</section>
		</div>
	);
}
