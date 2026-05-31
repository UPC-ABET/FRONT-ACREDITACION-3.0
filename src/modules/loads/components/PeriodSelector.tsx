'use client';

import { useEffect } from 'react';
import { Button, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { usePeriods } from '../hooks';
import type { Period } from '../types';

interface PeriodSelectorProps {
	selectedPeriodId: number | null;
	onChange: (periodId: number | null) => void;
	onCreate: () => void;
}

export default function PeriodSelector({
	selectedPeriodId,
	onChange,
	onCreate,
}: PeriodSelectorProps) {
	const { t } = useI18n();
	const { data: periods, isLoading } = usePeriods();

	useEffect(() => {
		if (selectedPeriodId === null && periods && periods.length > 0) {
			onChange(periods[0].id);
		}
	}, [periods, selectedPeriodId, onChange]);

	const options = (periods ?? []).map((p: Period) => ({
		value: String(p.id),
		label: `${p.code} (${p.status})`,
	}));

	return (
		<div className="flex items-end gap-3">
			<div className="flex-1">
				<label htmlFor="period-selector" className="mb-1 block text-xs font-medium text-gray-600">
					{t('loadsSetup.period.selectorLabel')}
				</label>
				<Select
					name="period-selector"
					value={options.find((o) => o.value === String(selectedPeriodId)) ?? null}
					onChange={(_name, opt) => {
						const v = Array.isArray(opt) ? opt[0] : opt;
						onChange(v ? Number(v.value) : null);
					}}
					options={options}
					placeholder={
						isLoading ? t('loadsSetup.period.loading') : t('loadsSetup.period.selectPlaceholder')
					}
				/>
			</div>
			<Button variant="primary" onClick={onCreate}>
				+ {t('loadsSetup.period.newButton')}
			</Button>
		</div>
	);
}
