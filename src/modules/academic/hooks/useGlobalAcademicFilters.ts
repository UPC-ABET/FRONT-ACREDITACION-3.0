'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SCHOOL_LABEL_KEYS_BY_CODE } from '@/modules/auth/constants';
import { getTypesByGroupCode } from '@/modules/core';
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

export function useGlobalAcademicFilters() {
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
	const modalityCompactOptions = modalitySelectOptions.map((option) => ({
		value: String(option.value),
		label: option.label,
	}));

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
		selectedModalityOption,
		selectedSchoolOption,
		setAcademicPeriodId,
	};
}
