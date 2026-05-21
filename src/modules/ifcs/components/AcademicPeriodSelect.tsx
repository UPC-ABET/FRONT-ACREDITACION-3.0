'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { getAllAcademicPeriods } from '../services/academicPeriodsService';
import type { AcademicPeriod } from '../services/types';

type Props = {
	value: number | null;
	onChange: (id: number) => void;
};

export function AcademicPeriodSelect({ value, onChange }: Props) {
	const { t } = useI18n();
	const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		getAllAcademicPeriods()
			.then((rows) => {
				if (active) setPeriods(rows);
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
	}, []);

	const options = useMemo(() => periods.map((p) => ({ value: p.id, label: p.code })), [periods]);

	const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

	return (
		<Select
			label={t('ifcs.page.period')}
			isDisabled={loading}
			placeholder={loading ? t('loading.default') : undefined}
			value={selected}
			onChange={(_, opt) => {
				const next = (opt as { value?: number | string } | null)?.value;
				if (next != null) onChange(Number(next));
			}}
			options={options}
		/>
	);
}
