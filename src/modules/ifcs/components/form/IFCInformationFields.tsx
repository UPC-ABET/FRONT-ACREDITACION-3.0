'use client';

import { useI18n } from '@/providers';
import { I18nTextField } from '@/shared/components';
import type { I18nText, IFCField } from '../../services/types';

type Props = {
	fields: IFCField[];
	values: Record<string, I18nText>;
	onChange: (key: string, value: I18nText) => void;
};

export function IFCInformationFields({ fields, values, onChange }: Props) {
	const { locale: lang } = useI18n();
	if (fields.length === 0) return null;

	const sorted = [...fields].sort((a, b) => a.order - b.order);

	return (
		<section className="space-y-6">
			{sorted.map((f) => (
				<I18nTextField
					key={f.key}
					label={f.label[lang] ?? f.label.es ?? f.key}
					required={f.required}
					value={values[f.key] ?? {}}
					onChange={(next) => onChange(f.key, next)}
				/>
			))}
		</section>
	);
}
