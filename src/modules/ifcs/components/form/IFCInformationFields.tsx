'use client';

import { useI18n } from '@/providers';
import { TextArea } from '@/shared/components';
import type { I18nText, IFCField } from '../../services/types';

type Props = {
	fields: IFCField[];
	languages: string[];
	values: Record<string, I18nText>;
	onChange: (key: string, value: I18nText) => void;
};

export function IFCInformationFields({ fields, languages, values, onChange }: Props) {
	const { locale: lang } = useI18n();
	if (fields.length === 0) return null;

	const sorted = [...fields].sort((a, b) => a.order - b.order);

	return (
		<section className="space-y-6">
			{sorted.map((f) => {
				const current = values[f.key] ?? {};
				return (
					<div key={f.key} className="space-y-2">
						<label className="block text-base font-semibold text-zinc-900">
							{f.label[lang] ?? f.label.es ?? f.key}
							{f.required && <span className="ml-1 text-red-600">*</span>}
						</label>
						<div className="space-y-3">
							{languages.map((l) => (
								<TextArea
									key={l}
									label={l.toUpperCase()}
									value={current[l] ?? ''}
									onChange={(e) => onChange(f.key, { ...current, [l]: e.target.value })}
								/>
							))}
						</div>
					</div>
				);
			})}
		</section>
	);
}
