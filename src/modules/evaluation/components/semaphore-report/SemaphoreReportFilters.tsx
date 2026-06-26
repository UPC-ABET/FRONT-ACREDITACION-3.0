'use client';

import { Button, Card, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import type {
	SemaphoreFilterOption,
	SemaphoreReportFiltersState,
} from '../../hooks/useSemaphoreReportFilters';

interface SemaphoreReportFiltersProps {
	readonly state: SemaphoreReportFiltersState;
}

function selectedOption(
	options: SemaphoreFilterOption[],
	value: number | null,
): SemaphoreFilterOption | null {
	return options.find((option) => option.value === value) ?? null;
}

function asSingle<T>(value: T | T[] | null): T | null {
	return value && !Array.isArray(value) ? value : null;
}

export function SemaphoreReportFilters({ state }: SemaphoreReportFiltersProps) {
	const { t } = useI18n();

	const languageOptions: SemaphoreFilterOption[] = [
		{ value: 0, label: t('semaphoreReports.filters.languageEs') },
		{ value: 1, label: t('semaphoreReports.filters.languageEn') },
	];
	const selectedLanguage = languageOptions[state.lang === 'en' ? 1 : 0];

	return (
		<Card className="p-5 space-y-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Select
					name="accreditor"
					label={t('semaphoreReports.filters.accreditor')}
					placeholder={t('semaphoreReports.filters.allAccreditors')}
					isClearable
					isSearchable
					options={state.accreditorOptions}
					value={selectedOption(state.accreditorOptions, state.accreditorId)}
					onChange={(_name, value) => state.onAccreditorChange(asSingle(value))}
				/>
				<Select
					name="commission"
					label={t('semaphoreReports.filters.commission')}
					placeholder={t('semaphoreReports.filters.allCommissions')}
					isClearable
					isSearchable
					isDisabled={state.accreditorId == null}
					options={state.commissionOptions}
					value={selectedOption(state.commissionOptions, state.commissionId)}
					onChange={(_name, value) => state.onCommissionChange(asSingle(value))}
				/>
				<Select
					name="program"
					label={t('semaphoreReports.filters.program')}
					placeholder={t('semaphoreReports.filters.allPrograms')}
					isClearable
					isSearchable
					isDisabled={state.commissionId == null || state.isLoadingPrograms}
					options={state.programOptions}
					value={selectedOption(state.programOptions, state.programId)}
					onChange={(_name, value) => state.onProgramChange(asSingle(value))}
				/>
				<Select
					name="outcome"
					label={t('semaphoreReports.filters.outcome')}
					placeholder={t('semaphoreReports.filters.allOutcomes')}
					isClearable
					isSearchable
					isDisabled={state.programId == null || state.isLoadingOutcomes}
					options={state.outcomeOptions}
					value={selectedOption(state.outcomeOptions, state.outcomeId)}
					onChange={(_name, value) => state.onOutcomeChange(asSingle(value))}
				/>
				<Select
					name="campus"
					label={t('semaphoreReports.filters.campus')}
					placeholder={t('semaphoreReports.filters.allCampuses')}
					isClearable
					isSearchable
					options={state.campusOptions}
					value={selectedOption(state.campusOptions, state.campusId)}
					onChange={(_name, value) => state.onCampusChange(asSingle(value))}
				/>
				<Select
					name="language"
					label={t('semaphoreReports.filters.language')}
					options={languageOptions}
					value={selectedLanguage}
					onChange={(_name, value) => {
						const single = asSingle(value);
						if (single) state.onLangChange(single.value === 1 ? 'en' : 'es');
					}}
				/>
			</div>
			<div className="flex justify-end">
				<Button
					variant="surface"
					size="sm"
					onClick={state.reset}
					disabled={!state.hasActiveFilters && state.programId == null}>
					{t('semaphoreReports.filters.clear')}
				</Button>
			</div>
		</Card>
	);
}
