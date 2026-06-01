'use client';

import { useMemo } from 'react';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import { Select } from '@/shared/components';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useI18n } from '@/providers';
import { findFlowByTypeCode } from '../constants';

interface UploadTypeSelectProps {
	value: string | null;
	onChange: (typeCode: string) => void;
}

export default function UploadTypeSelect({ value, onChange }: UploadTypeSelectProps) {
	const { t, locale } = useI18n();
	const { data: types, isLoading } = useTypesByGroupCode(TYPE_GROUP_CODES.UPLOAD_TYPE);

	const options = useMemo(() => {
		const list = types ?? [];
		return list
			.filter((type) => findFlowByTypeCode(type.code))
			.map((type) => ({ value: type.code, label: type.name[locale] ?? type.code }));
	}, [types, locale]);

	const selected = options.find((opt) => opt.value === value) ?? null;

	return (
		<Select
			label={t('loads.upload.typeLabel')}
			isDisabled={isLoading}
			placeholder={isLoading ? t('loading.default') : t('loads.upload.typePlaceholder')}
			value={selected}
			onChange={(_, opt) => {
				const next = (opt as { value?: string } | null)?.value;
				if (next) onChange(next);
			}}
			options={options}
		/>
	);
}
