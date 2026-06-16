'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { getSurveyTypeId } from '../../services/academicService';
import { getSurveyMessagesByFilters } from '@/modules/admin/notifications/services/notificationMessagesService';
import type { SurveyMessage } from '@/modules/admin/notifications/types';

interface Props {
	surveyTypeCode: 'PPP' | 'GRA' | 'LCFC';
	programId?: number;
	value: number | null;
	onChange: (id: number | null) => void;
}

export function SurveyTemplateSelect({ surveyTypeCode, programId, value, onChange }: Props) {
	const { t, locale } = useI18n();
	const [options, setOptions] = useState<{ value: number; label: string }[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		(async () => {
			try {
				const surveyTypeId = await getSurveyTypeId(surveyTypeCode);
				const messages = await getSurveyMessagesByFilters({
					...(surveyTypeId > 0 ? { surveyTypeId } : {}),
					...(programId ? { programId } : {}),
					isActive: true,
				});
				if (!cancelled) {
					setOptions(
						messages.map((m: SurveyMessage) => ({
							value: m.id,
							label: m.name?.[locale as 'es' | 'en'] ?? m.name?.es ?? `Template #${m.id}`,
						})),
					);
				}
			} catch {
				if (!cancelled) setOptions([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [surveyTypeCode, programId, locale]);

	const selected = options.find((o) => o.value === value) ?? null;

	return (
		<Select
			label={t('surveys.notifications.templateLabel')}
			placeholder={
				loading
					? t('surveys.notifications.templateLoading')
					: t('surveys.notifications.templatePlaceholder')
			}
			options={options}
			value={selected}
			isSearchable
			isClearable
			onChange={(_name, val) => {
				if (val && !Array.isArray(val)) {
					onChange(Number(val.value));
				} else {
					onChange(null);
				}
			}}
		/>
	);
}
