'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { PERFORMANCE_REPORT_KINDS } from '../../constants/performanceReports';
import type {
	PerformanceReportFilterOption,
	PerformanceReportFiltersState,
} from '../../hooks/usePerformanceReportFilters';
import type { PerformanceReportKind } from '../../types';

interface PerformanceReportFiltersProps {
	readonly state: PerformanceReportFiltersState;
	readonly kind: PerformanceReportKind;
}

function selectedOption(
	options: PerformanceReportFilterOption[],
	value: number | null,
): PerformanceReportFilterOption | null {
	return options.find((option) => option.value === value) ?? null;
}

function selectedOptions(
	options: PerformanceReportFilterOption[],
	values: number[],
): PerformanceReportFilterOption[] {
	return options.filter((option) => values.includes(option.value));
}

function asSingle<T>(value: T | T[] | null): T | null {
	return value && !Array.isArray(value) ? value : null;
}

export function PerformanceReportFilters({ state, kind }: PerformanceReportFiltersProps) {
	const { t } = useI18n();
	// The grade-type selector only applies to RV (RC grades are the course weighted average).
	const showGradeTypeFilter = kind === PERFORMANCE_REPORT_KINDS.RV;
	const canClear = state.hasActiveFilters || state.programId != null;

	const languageOptions: PerformanceReportFilterOption[] = [
		{ value: 0, label: t('performanceReports.filters.languageEs') },
		{ value: 1, label: t('performanceReports.filters.languageEn') },
	];
	const selectedLanguage = languageOptions[state.lang === 'en' ? 1 : 0];

	return (
		<Card className="p-5 space-y-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Select
					name="accreditor"
					label={t('performanceReports.filters.accreditor')}
					placeholder={t('performanceReports.filters.allAccreditors')}
					isClearable
					isSearchable
					options={state.accreditorOptions}
					value={selectedOption(state.accreditorOptions, state.accreditorId)}
					onChange={(_name, value) => state.onAccreditorChange(asSingle(value))}
				/>
				<Select
					name="commission"
					label={t('performanceReports.filters.commission')}
					placeholder={t('performanceReports.filters.allCommissions')}
					isClearable
					isSearchable
					isDisabled={state.accreditorId == null}
					options={state.commissionOptions}
					value={selectedOption(state.commissionOptions, state.commissionId)}
					onChange={(_name, value) => state.onCommissionChange(asSingle(value))}
				/>
				<Select
					name="program"
					label={t('performanceReports.filters.program')}
					placeholder={t('performanceReports.filters.allPrograms')}
					isClearable
					isSearchable
					isDisabled={state.commissionId == null || state.isLoadingPrograms}
					options={state.programOptions}
					value={selectedOption(state.programOptions, state.programId)}
					onChange={(_name, value) => state.onProgramChange(asSingle(value))}
				/>
				<Select
					name="outcome"
					label={t('performanceReports.filters.outcome')}
					placeholder={t('performanceReports.filters.allOutcomes')}
					isClearable
					isSearchable
					isDisabled={state.programId == null || state.isLoadingOutcomes}
					options={state.outcomeOptions}
					value={selectedOption(state.outcomeOptions, state.outcomeId)}
					onChange={(_name, value) => state.onOutcomeChange(asSingle(value))}
				/>
				<Select
					name="campus"
					label={t('performanceReports.filters.campus')}
					placeholder={t('performanceReports.filters.allCampuses')}
					isClearable
					isSearchable
					options={state.campusOptions}
					value={selectedOption(state.campusOptions, state.campusId)}
					onChange={(_name, value) => state.onCampusChange(asSingle(value))}
				/>
				<Select
					name="language"
					label={t('performanceReports.filters.language')}
					options={languageOptions}
					value={selectedLanguage}
					onChange={(_name, value) => {
						const single = asSingle(value);
						if (single) state.onLangChange(single.value === 1 ? 'en' : 'es');
					}}
				/>
				{showGradeTypeFilter && (
					<Select
						name="gradeTypes"
						label={t('performanceReports.filters.gradeTypes')}
						placeholder={t('performanceReports.filters.allGradeTypes')}
						isMulti
						isClearable
						isSearchable
						isDisabled={state.isLoadingGradeTypes}
						options={state.gradeTypeOptions}
						value={selectedOptions(state.gradeTypeOptions, state.gradeTypeIds)}
						onChange={(_name, value) =>
							state.onGradeTypesChange(
								Array.isArray(value) ? value.map((option) => Number(option.value)) : [],
							)
						}
					/>
				)}
			</div>
			{showGradeTypeFilter && (
				<p className="text-xs text-zinc-500">{t('performanceReports.filters.gradeTypesHint')}</p>
			)}
			{canClear && (
				<div className="flex justify-end">
					<Button variant="secondary" onClick={state.reset}>
						<TrashIcon className="h-4 w-4" />
						{t('performanceReports.filters.clear')}
					</Button>
				</div>
			)}
		</Card>
	);
}
