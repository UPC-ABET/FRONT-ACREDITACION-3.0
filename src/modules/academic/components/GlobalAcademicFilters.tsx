'use client';

import type { ReactNode } from 'react';
import { CompactNavbarSelect, Select } from '@/shared/components';
import {
	useGlobalAcademicFiltersLock,
	useGlobalAcademicFiltersVisibility,
	useI18n,
	type GlobalAcademicFilterKey,
} from '@/providers';
import { useGlobalAcademicFilters } from '@/modules';
import { AcademicPeriodSelect } from '@/modules';

type GlobalAcademicFiltersLayout = 'inline' | 'mobile' | 'tablet';

type GlobalAcademicFiltersProps = {
	embedded?: boolean;
	layout?: GlobalAcademicFiltersLayout;
};

type FilterItemProps = {
	children: ReactNode;
	embedded: boolean;
	mobile: boolean;
	widthClass?: string;
};

function FilterItem({ children, embedded, mobile, widthClass }: FilterItemProps) {
	const className = mobile
		? 'min-w-0'
		: embedded
			? `${widthClass ?? 'max-w-[220px]'} min-w-0 flex-1`
			: 'min-w-[210px] flex-1 max-w-[340px]';

	return <div className={className}>{children}</div>;
}

function layoutClasses(embedded: boolean, layout: GlobalAcademicFiltersLayout) {
	if (embedded)
		return `flex w-full min-w-0 items-center ${layout === 'tablet' ? 'gap-2' : 'gap-3'}`;
	return 'flex w-full items-center gap-3 flex-wrap';
}

function mobileLayoutClasses(visibleFilterCount: number) {
	const columnClass = {
		1: 'grid-cols-1',
		2: 'grid-cols-2',
		3: 'grid-cols-3',
	}[visibleFilterCount];

	return `grid w-full min-w-0 ${columnClass ?? 'grid-cols-3'} gap-2 px-2`;
}

function embeddedWidth(layout: GlobalAcademicFiltersLayout, field: GlobalAcademicFilterKey) {
	if (layout === 'tablet') {
		return {
			school: 'max-w-[150px]',
			modality: 'max-w-[135px]',
			period: 'max-w-[210px]',
		}[field];
	}

	return {
		school: 'max-w-[250px]',
		modality: 'max-w-[230px]',
		period: 'max-w-[310px]',
	}[field];
}

export function GlobalAcademicFilters({
	embedded = false,
	layout = 'inline',
}: GlobalAcademicFiltersProps) {
	const { t } = useI18n();
	const filters = useGlobalAcademicFilters();
	const visibleFilters = useGlobalAcademicFiltersVisibility();
	const lockedFilters = useGlobalAcademicFiltersLock();
	const visibleFilterCount = Object.values(visibleFilters).filter(Boolean).length;
	const isMobileLayout = embedded && layout === 'mobile';
	const compactDensity = layout === 'tablet' ? 'compact' : 'normal';
	const compactLabelPlacement = isMobileLayout ? 'stacked' : 'inline';

	if (visibleFilterCount === 0) return null;

	return (
		<div
			className={
				embedded ? 'w-full min-w-0' : 'w-full border-b border-zinc-200 bg-white px-6 py-4'
			}>
			<div
				className={
					isMobileLayout ? mobileLayoutClasses(visibleFilterCount) : layoutClasses(embedded, layout)
				}>
				{visibleFilters.modality && (
					<FilterItem
						embedded={embedded}
						mobile={isMobileLayout}
						widthClass={embeddedWidth(layout, 'modality')}>
						{embedded ? (
							<CompactNavbarSelect
								label={t('admin.configuration.periods.form.modality')}
								value={filters.modalityTypeId === null ? '' : String(filters.modalityTypeId)}
								options={filters.modalityCompactOptions}
								placeholder={t('select.placeholder.default')}
								disabled={lockedFilters.modality}
								labelPlacement={compactLabelPlacement}
								density={compactDensity}
								noOptionsMessage={t('select.noOptions')}
								onChange={(value) => {
									if (value !== '') filters.handleModalityChange(Number(value));
								}}
							/>
						) : (
							<Select
								label={t('admin.configuration.periods.form.modality')}
								name="modality"
								value={filters.selectedModalityOption}
								options={filters.modalitySelectOptions}
								isSearchable={false}
								isDisabled={lockedFilters.modality || filters.modalitySelectOptions.length === 0}
								onChange={(_, selected) => {
									if (!selected || Array.isArray(selected)) return;
									filters.handleModalityChange(Number(selected.value));
								}}
							/>
						)}
					</FilterItem>
				)}

				{visibleFilters.period && (
					<FilterItem
						embedded={embedded}
						mobile={isMobileLayout}
						widthClass={embeddedWidth(layout, 'period')}>
						<AcademicPeriodSelect
							value={filters.academicPeriodId}
							onChange={(id) => filters.setAcademicPeriodId(id)}
							isClearable
							onClear={() => filters.setAcademicPeriodId(null)}
							disabled={lockedFilters.period}
							labelPlacement={embedded ? 'inline' : 'stacked'}
							compactLabelPlacement={compactLabelPlacement}
							compactDensity={compactDensity}
						/>
					</FilterItem>
				)}

				{visibleFilters.school && (
					<FilterItem
						embedded={embedded}
						mobile={isMobileLayout}
						widthClass={embeddedWidth(layout, 'school')}>
						{embedded ? (
							<CompactNavbarSelect
								label={t('navbar.school.label')}
								value={filters.selectedSchoolOption?.value ?? ''}
								options={filters.schoolOptions}
								placeholder={
									filters.schoolsLoading ? t('loading.default') : t('select.placeholder.default')
								}
								disabled={lockedFilters.school || filters.schoolsLoading}
								labelPlacement={compactLabelPlacement}
								density={compactDensity}
								wrapOptions
								noOptionsMessage={t('select.noOptions')}
								onChange={filters.handleSchoolChange}
							/>
						) : (
							<Select
								label={t('navbar.school.label')}
								name="school"
								value={filters.selectedSchoolOption}
								options={filters.schoolOptions}
								isSearchable
								isDisabled={
									lockedFilters.school ||
									filters.schoolsLoading ||
									filters.schoolOptions.length === 0
								}
								onChange={(_, selected) => {
									if (!selected || Array.isArray(selected)) return;
									filters.handleSchoolChange(String(selected.value));
								}}
							/>
						)}
					</FilterItem>
				)}
			</div>
		</div>
	);
}
