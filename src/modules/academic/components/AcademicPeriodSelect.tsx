'use client';

import { useEffect, useMemo } from 'react';
import { CompactNavbarSelect, Select } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useAcademicPeriods } from '../hooks';

type AcademicPeriodOption = {
	id: number;
	code: string;
	startDate: string;
	endDate: string;
};

type Props = {
	value: number | null;
	onChange: (id: number) => void;
	isClearable?: boolean;
	onClear?: () => void;
	disabled?: boolean;
	labelPlacement?: 'stacked' | 'inline';
	compactLabelPlacement?: 'inline' | 'stacked';
	compactDensity?: 'normal' | 'compact';
};

function dateValue(value: string) {
	const time = new Date(value).getTime();
	return Number.isNaN(time) ? 0 : time;
}

function compareAcademicPeriods(a: AcademicPeriodOption, b: AcademicPeriodOption) {
	const endDateDiff = dateValue(b.endDate) - dateValue(a.endDate);
	if (endDateDiff !== 0) return endDateDiff;

	const startDateDiff = dateValue(b.startDate) - dateValue(a.startDate);
	if (startDateDiff !== 0) return startDateDiff;

	return b.code.localeCompare(a.code);
}

export function AcademicPeriodSelect({
	value,
	onChange,
	isClearable,
	onClear,
	disabled = false,
	labelPlacement = 'stacked',
	compactLabelPlacement = 'inline',
	compactDensity = 'normal',
}: Props) {
	const { t } = useI18n();
	const { modalityTypeId } = useABET();

	const { data: periodRows = [], isLoading } = useAcademicPeriods(
		{ modalityTypeId: modalityTypeId ?? undefined },
		{ enabled: modalityTypeId !== null },
	);
	const loading = modalityTypeId === null || isLoading;

	const periods = useMemo<AcademicPeriodOption[]>(
		() =>
			periodRows
				.map((r) => ({
					id: r.id,
					code: r.code,
					startDate: r.startDate,
					endDate: r.endDate,
				}))
				.sort(compareAcademicPeriods),
		[periodRows],
	);

	const options = useMemo(() => periods.map((p) => ({ value: p.id, label: p.code })), [periods]);

	const selected = options.find((o) => o.value === value) ?? null;

	useEffect(() => {
		if (loading || selected !== null || options.length === 0) return;
		onChange(Number(options[0].value));
	}, [loading, onChange, options, selected]);

	if (labelPlacement === 'inline') {
		return (
			<CompactNavbarSelect
				label={t('ifcs.page.period')}
				value={selected ? String(selected.value) : ''}
				options={options.map((option) => ({
					value: String(option.value),
					label: option.label,
				}))}
				placeholder={loading ? t('loading.default') : t('select.placeholder.default')}
				disabled={loading || disabled}
				labelPlacement={compactLabelPlacement}
				density={compactDensity}
				noOptionsMessage={t('select.noOptions')}
				onChange={(next) => {
					if (next !== '') onChange(Number(next));
					else if (isClearable) onClear?.();
				}}
			/>
		);
	}

	return (
		<Select
			label={t('ifcs.page.period')}
			isDisabled={loading || disabled}
			placeholder={loading ? t('loading.default') : undefined}
			value={selected}
			isClearable={isClearable}
			onChange={(_, opt) => {
				const next = (opt as { value?: number | string } | null)?.value;
				if (next != null) onChange(Number(next));
				else onClear?.();
			}}
			options={options}
		/>
	);
}
