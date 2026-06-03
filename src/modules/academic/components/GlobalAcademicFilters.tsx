'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CompactNavbarSelect, Select } from '@/shared/components';
import { SCHOOL_LABEL_KEYS_BY_CODE } from '@/modules/auth/constants';
import { getTypesByGroupCode } from '@/modules/core';
import { AcademicPeriodSelect } from './AcademicPeriodSelect';
import { useABET, useAuth, useI18n } from '@/providers';
import { TYPE_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import { getSchoolCookie, setActiveSchoolId, setSchoolCookie } from '@/shared/lib';

type SchoolOption = {
	value: string;
	label: string;
};

function readCookieSchoolCode(): string {
	const school = getSchoolCookie();
	const schoolCode = school?.code as string | undefined;
	return typeof schoolCode === 'string' ? schoolCode : '';
}

function FilterItem({
	children,
	embedded,
	embeddedClassName,
}: {
	children: ReactNode;
	embedded: boolean;
	embeddedClassName?: string;
}) {
	return (
		<div
			className={
				embedded
					? `${embeddedClassName ?? 'w-[220px]'} flex-none`
					: 'min-w-[210px] flex-1 max-w-[340px]'
			}>
			{children}
		</div>
	);
}

export function GlobalAcademicFilters({ embedded = false }: { embedded?: boolean }) {
	const queryClient = useQueryClient();
	const { t, locale } = useI18n();
	const { userSchools, changeModalityCode } = useAuth();
	const { modalityTypeId, setModalityTypeId, academicPeriodId, setAcademicPeriodId } = useABET();
	const [selectedSchoolCode, setSelectedSchoolCode] = useState(readCookieSchoolCode);

	const { data: modalityOptions = [] } = useQuery({
		queryKey: ['types', TYPE_GROUP_CODES.PROGRAM_MODALITY],
		queryFn: () => getTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY),
		staleTime: Infinity,
	});

	useEffect(() => {
		if (modalityOptions.length > 0 && modalityTypeId === null) {
			const defaultOption =
				modalityOptions.find((option) => option.code === TYPE_CODES.PROGRAM_MODALITY.REGULAR) ??
				modalityOptions[0];
			setModalityTypeId(defaultOption.id);
		}
	}, [modalityOptions, modalityTypeId, setModalityTypeId]);

	const schoolOptions = useMemo<SchoolOption[]>(
		() =>
			userSchools.map((school) => {
				const labelKey = SCHOOL_LABEL_KEYS_BY_CODE[school.code];
				const translatedLabel = labelKey ? t(labelKey) : '';
				const fallbackLabel =
					school.name[locale] ?? school.name.es ?? school.name.en ?? school.code;
				return {
					value: school.code,
					label: translatedLabel && translatedLabel !== labelKey ? translatedLabel : fallbackLabel,
				};
			}),
		[userSchools, locale, t],
	);

	const selectedSchool =
		userSchools.find((school) => school.code === selectedSchoolCode) ?? userSchools[0] ?? null;

	const selectedSchoolOption =
		schoolOptions.find((option) => option.value === selectedSchool?.code) ?? null;

	useEffect(() => {
		setActiveSchoolId(selectedSchool ? selectedSchool.id : null);
		if (selectedSchool) setSchoolCookie(selectedSchool);
	}, [selectedSchool]);

	const modalitySelectOptions = useMemo(
		() =>
			modalityOptions.map((option) => ({
				value: option.id,
				label: option.name[locale] ?? option.name.es ?? option.code,
			})),
		[modalityOptions, locale],
	);

	const selectedModalityOption =
		modalitySelectOptions.find((option) => option.value === modalityTypeId) ?? null;

	function handleSchoolChange(code: string) {
		const school = userSchools.find((item) => item.code === code);
		if (!school) return;
		setSelectedSchoolCode(school.code);
		setSchoolCookie(school);
		setActiveSchoolId(school.id);
		setAcademicPeriodId(null);
		queryClient.invalidateQueries();
	}

	function handleModalityChange(id: number) {
		setModalityTypeId(id);
		setAcademicPeriodId(null);
		const selectedModality = modalityOptions.find((option) => option.id === id);
		if (selectedModality) {
			changeModalityCode(selectedModality.code);
		}
		queryClient.invalidateQueries();
	}

	return (
		<div
			className={
				embedded ? 'w-full min-w-0' : 'w-full border-b border-zinc-200 bg-white px-6 py-4'
			}>
			<div
				className={
					embedded
						? 'flex w-full min-w-0 items-center gap-3'
						: 'flex w-full items-center gap-3 flex-wrap'
				}>
				<FilterItem embedded={embedded} embeddedClassName="w-[250px]">
					{embedded ? (
						<CompactNavbarSelect
							label={t('navbar.school.label')}
							value={selectedSchoolOption?.value ?? ''}
							options={schoolOptions}
							placeholder={t('select.placeholder.default')}
							disabled={schoolOptions.length === 0}
							onChange={handleSchoolChange}
						/>
					) : (
						<Select
							label={t('navbar.school.label')}
							name="school"
							value={selectedSchoolOption}
							options={schoolOptions}
							isSearchable
							isDisabled={schoolOptions.length === 0}
							onChange={(_, selected) => {
								if (!selected || Array.isArray(selected)) return;
								handleSchoolChange(String(selected.value));
							}}
						/>
					)}
				</FilterItem>

				<FilterItem embedded={embedded} embeddedClassName="w-[230px]">
					{embedded ? (
						<CompactNavbarSelect
							label={t('admin.configuration.periods.form.modality')}
							value={modalityTypeId === null ? '' : String(modalityTypeId)}
							options={modalitySelectOptions.map((option) => ({
								value: String(option.value),
								label: option.label,
							}))}
							placeholder={t('select.placeholder.default')}
							disabled={modalitySelectOptions.length === 0}
							onChange={(value) => {
								if (value !== '') handleModalityChange(Number(value));
							}}
						/>
					) : (
						<Select
							label={t('admin.configuration.periods.form.modality')}
							name="modality"
							value={selectedModalityOption}
							options={modalitySelectOptions}
							isSearchable={false}
							isDisabled={modalitySelectOptions.length === 0}
							onChange={(_, selected) => {
								if (!selected || Array.isArray(selected)) return;
								handleModalityChange(Number(selected.value));
							}}
						/>
					)}
				</FilterItem>

				<FilterItem embedded={embedded} embeddedClassName="w-[310px]">
					<AcademicPeriodSelect
						value={academicPeriodId}
						onChange={(id) => setAcademicPeriodId(id)}
						isClearable
						onClear={() => setAcademicPeriodId(null)}
						labelPlacement={embedded ? 'inline' : 'stacked'}
					/>
				</FilterItem>
			</div>
		</div>
	);
}
