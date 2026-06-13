'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTypesByGroupCode } from '@/modules/core';
import { useABET, useAuth, useI18n, useSchoolSource, useSchoolSourceData } from '@/providers';
import { TYPE_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import type { SchoolSourceItem } from '@/shared/types';
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

export function useGlobalAcademicFilters() {
	const queryClient = useQueryClient();
	const { locale } = useI18n();
	const { userSchools, changeModalityCode } = useAuth();
	const { modalityTypeId, setModalityTypeId, academicPeriodId, setAcademicPeriodId, setSchoolId } =
		useABET();
	const [selectedSchoolCode, setSelectedSchoolCode] = useState(readCookieSchoolCode);

	const schoolSource = useSchoolSource();
	const { schools: sourceSchools, isLoading: schoolsLoading, hasSource } = useSchoolSourceData();
	const schools = useMemo<SchoolSourceItem[]>(
		() => (hasSource ? sourceSchools : userSchools),
		[hasSource, sourceSchools, userSchools],
	);

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
			schools.map((school) => ({
				value: school.code,
				label: school.name[locale] ?? school.name.es ?? school.name.en ?? school.code,
			})),
		[schools, locale],
	);

	const selectedSchool =
		schools.find((school) => school.code === selectedSchoolCode) ?? schools[0] ?? null;
	const selectedSchoolOption =
		schoolOptions.find((option) => option.value === selectedSchool?.code) ?? null;

	useEffect(() => {
		setActiveSchoolId(selectedSchool ? selectedSchool.id : null);
		setSchoolId(selectedSchool ? selectedSchool.id : null);
		if (selectedSchool) setSchoolCookie(selectedSchool);
	}, [selectedSchool, setSchoolId]);

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
	const modalityCompactOptions = modalitySelectOptions.map((option) => ({
		value: String(option.value),
		label: option.label,
	}));

	function handleSchoolChange(code: string) {
		const school = schools.find((item) => item.code === code);
		if (!school) return;
		setSelectedSchoolCode(school.code);
		setSchoolCookie(school);
		setActiveSchoolId(school.id);
		setSchoolId(school.id);
		// With a custom source (e.g. IFC) the school list depends on the period, so keep the period.
		if (schoolSource == null) setAcademicPeriodId(null);
		queryClient.invalidateQueries();
	}

	function handleModalityChange(id: number) {
		setModalityTypeId(id);
		setAcademicPeriodId(null);
		const selectedModality = modalityOptions.find((option) => option.id === id);
		if (selectedModality) changeModalityCode(selectedModality.code);
		queryClient.invalidateQueries();
	}

	return {
		academicPeriodId,
		handleModalityChange,
		handleSchoolChange,
		modalityCompactOptions,
		modalitySelectOptions,
		modalityTypeId,
		schoolOptions,
		schoolsLoading,
		selectedModalityOption,
		selectedSchoolOption,
		setAcademicPeriodId,
	};
}
