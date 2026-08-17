'use client';

import React from 'react';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import type { OptionItem } from '../../types';

interface CommissionCampusFiltersProps {
	commissionOptions: OptionItem[];
	campusOptions: OptionItem[];
	commission: OptionItem | null;
	campus: OptionItem | null;
	onCommissionChange: (option: OptionItem | null) => void;
	onCampusChange: (option: OptionItem | null) => void;
	/** Wrapper classes. Pass `contents` to drop the two selects straight into a parent grid
	 *  that also holds other filters (the report screens do this). */
	className?: string;
	/** Prefix for the selects' `name`, so two instances on one page stay distinguishable. */
	namePrefix?: string;
}

export function CommissionCampusFilters({
	commissionOptions,
	campusOptions,
	commission,
	campus,
	onCommissionChange,
	onCampusChange,
	className = 'grid grid-cols-1 gap-4 md:grid-cols-2',
	namePrefix = '',
}: CommissionCampusFiltersProps) {
	const { t } = useI18n();

	return (
		<div className={className}>
			<Select
				name={`${namePrefix}commission`}
				label={t('surveys.perception.commission')}
				placeholder={t('surveys.perception.allCommissions')}
				isClearable
				isSearchable
				options={commissionOptions}
				value={commission}
				onChange={(_name, value) =>
					onCommissionChange(value && !Array.isArray(value) ? (value as OptionItem) : null)
				}
			/>
			<Select
				name={`${namePrefix}campus`}
				label={t('surveys.perception.campus')}
				placeholder={t('surveys.perception.allCampuses')}
				isClearable
				isSearchable
				options={campusOptions}
				value={campus}
				onChange={(_name, value) =>
					onCampusChange(value && !Array.isArray(value) ? (value as OptionItem) : null)
				}
			/>
		</div>
	);
}
