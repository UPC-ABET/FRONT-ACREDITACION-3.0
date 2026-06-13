'use client';

import { useEffect, useMemo, useState } from 'react';
import { CompactNavbarSelect, Select } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { academicPeriodsService } from '../services';

type AcademicPeriodOption = { id: number; code: string };

type Props = {
	value: number | null;
	onChange: (id: number) => void;
	isClearable?: boolean;
	onClear?: () => void;
	labelPlacement?: 'stacked' | 'inline';
	compactLabelPlacement?: 'inline' | 'stacked';
	compactDensity?: 'normal' | 'compact';
};

export function AcademicPeriodSelect({
	value,
	onChange,
	isClearable,
	onClear,
	labelPlacement = 'stacked',
	compactLabelPlacement = 'inline',
	compactDensity = 'normal',
}: Props) {
	const { t } = useI18n();
	const { modalityTypeId } = useABET();
	const [periods, setPeriods] = useState<AcademicPeriodOption[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (modalityTypeId === null) {
			setPeriods([]);
			setLoading(true);
			return;
		}
		let active = true;
		setLoading(true);
		academicPeriodsService
			.getByFilters({ modalityTypeId })
			.then((envelope) => {
				if (!active) return;
				const rows = (envelope?.data ?? [])
					.map((r) => ({ id: r.id, code: r.code }))
					.sort((a, b) => b.code.localeCompare(a.code));
				setPeriods(rows);
			})
			.catch(() => {
				if (active) setPeriods([]);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [modalityTypeId]);

	const options = useMemo(() => periods.map((p) => ({ value: p.id, label: p.code })), [periods]);

	const selected = options.find((o) => o.value === value) ?? null;
	const warningMessage =
		!loading && selected === null && options.length > 0
			? t('academic.period.requiredForData')
			: undefined;

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
				disabled={loading}
				labelPlacement={compactLabelPlacement}
				density={compactDensity}
				warningMessage={warningMessage}
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
			isDisabled={loading}
			placeholder={loading ? t('loading.default') : undefined}
			value={selected}
			isClearable={isClearable}
			error={warningMessage}
			onChange={(_, opt) => {
				const next = (opt as { value?: number | string } | null)?.value;
				if (next != null) onChange(Number(next));
				else onClear?.();
			}}
			options={options}
		/>
	);
}
