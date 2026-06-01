'use client';

import { useMemo } from 'react';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { useConfigurationPeriods } from '../hooks';

interface ConfigurationPeriodSelectProps {
	value: number | null;
	onChange: (id: number) => void;
	label?: string;
	placeholder?: string;
}

export default function ConfigurationPeriodSelect({
	value,
	onChange,
	label,
	placeholder,
}: ConfigurationPeriodSelectProps) {
	const { t } = useI18n();
	const { data: periods, isLoading } = useConfigurationPeriods();

	const options = useMemo(() => {
		return (periods ?? [])
			.slice()
			.sort((a, b) => b.code.localeCompare(a.code))
			.map((period) => ({
				value: period.id,
				label: period.isActive
					? `${period.code} · ${t('admin.configuration.periods.status.active')}`
					: period.code,
			}));
	}, [periods, t]);

	const selected = options.find((opt) => opt.value === value) ?? null;

	return (
		<Select
			label={label ?? t('admin.configuration.periods.selectLabel')}
			isDisabled={isLoading}
			placeholder={isLoading ? t('loading.default') : placeholder}
			value={selected}
			onChange={(_, opt) => {
				const next = (opt as { value?: number } | null)?.value;
				if (next != null) onChange(Number(next));
			}}
			options={options}
		/>
	);
}
