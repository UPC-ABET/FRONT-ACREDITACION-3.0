'use client';

import { useEffect, useMemo, useState } from 'react';
import { Select } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { getAcademicPeriodsByFilters } from '../services/academicPeriodsService';
import type { AcademicPeriod } from '../services/types';

type Props = {
	value: number | null;
	onChange: (id: number) => void;
};

export function AcademicPeriodSelect({ value, onChange }: Props) {
	const { t } = useI18n();
	const { modalityTypeId } = useABET();
	const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (modalityTypeId === null) {
			setPeriods([]);
			setLoading(true);
			return;
		}
		let active = true;
		setLoading(true);
		getAcademicPeriodsByFilters({ modality_type_id: modalityTypeId, is_active: true })
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
	}, [modalityTypeId]);

	const options = useMemo(() => periods.map((p) => ({ value: p.id, label: p.code })), [periods]);

	const selected = options.find((o) => o.value === value) ?? null;

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
