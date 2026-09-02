'use client';

import { MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, Card, Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { PERFORMANCE_REPORT_KINDS } from '@/modules';
import type { PerformanceReportFilterOption, PerformanceReportFiltersState } from '@/modules';
import type { PerformanceReportKind } from '@/modules';

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
	// The outcome and "Nivel de Desempeño" selectors only apply to RC -- it's generated one
	// outcome at a time (its PDF download is a zip with one report per selected outcome, or every
	// one when none is selected), and its PDF alone can narrow the chart/table to one level.
	const showOutcomeFilter = kind === PERFORMANCE_REPORT_KINDS.RC;
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
					placeholder={t('performanceReports.filters.selectProgram')}
					isClearable
					isSearchable
					isDisabled={state.commissionId == null || state.isLoadingPrograms}
					options={state.programOptions}
					value={selectedOption(state.programOptions, state.programId)}
					onChange={(_name, value) => state.onProgramChange(asSingle(value))}
				/>
				{showOutcomeFilter && (
					<Select
						name="outcomes"
						label={t('performanceReports.filters.outcome')}
						placeholder={t('performanceReports.filters.allOutcomes')}
						isMulti
						isClearable
						isSearchable
						isDisabled={state.programId == null || state.isLoadingOutcomes}
						options={state.outcomeOptions}
						value={selectedOptions(state.outcomeOptions, state.outcomeIds)}
						onChange={(_name, value) =>
							state.onOutcomesChange(
								Array.isArray(value) ? value.map((option) => Number(option.value)) : [],
							)
						}
					/>
				)}
				{showOutcomeFilter && (
					<Select
						name="performanceLevel"
						label={t('performanceReports.filters.performanceLevel')}
						placeholder={t('performanceReports.filters.allPerformanceLevels')}
						isClearable
						isSearchable
						isDisabled={state.isLoadingPerformanceLevels}
						options={state.performanceLevelOptions}
						value={selectedOption(state.performanceLevelOptions, state.performanceLevelId)}
						onChange={(_name, value) => state.onPerformanceLevelChange(asSingle(value))}
					/>
				)}
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
					isSearchable
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
			<div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4">
				{canClear && (
					<Button variant="secondary" onClick={state.reset}>
						<TrashIcon aria-hidden="true" className="h-4 w-4" />
						{t('performanceReports.filters.clear')}
					</Button>
				)}
				<Button variant="primary" onClick={state.search} disabled={!state.canSearch}>
					<MagnifyingGlassIcon aria-hidden="true" className="h-4 w-4" />
					{t('performanceReports.filters.search')}
				</Button>
			</div>
		</Card>
	);
}
