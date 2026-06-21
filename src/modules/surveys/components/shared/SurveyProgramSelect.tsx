'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { programsQueryKeys, programsService, type ProgramResponse } from '@/modules/academic';

interface Props {
	readonly value: number;
	readonly onChange: (programId: number) => void;
}

/**
 * Program picker shared by the survey screens. PPP and LCFC are outcome-based,
 * so they need a real programId; without it the backend has no outcomes/configs
 * to resolve and rejects the request.
 *
 * The program list is scoped to the active school (the top-bar Escuela selector)
 * via schoolFilter — the same source the Evaluation screens use. Listing programs
 * from other schools let the user pick a programId that doesn't belong to the
 * selected school, which made config generation fail.
 */
export function SurveyProgramSelect({ value, onChange }: Props) {
	const { t, locale } = useI18n();
	const { schoolId, modalityTypeId } = useABET();
	const { data: programs = [], isLoading } = useQuery({
		queryKey: programsQueryKeys.bySchoolModality(schoolId, modalityTypeId),
		queryFn: () =>
			programsService
				.getByFilters({ isActive: true, schoolFilter: true })
				.then((r) => r.data ?? []),
		enabled: schoolId != null && modalityTypeId != null,
	});

	const options = useMemo(
		() =>
			programs.map((p: ProgramResponse) => ({
				label: p.name[locale] ?? p.name.es ?? p.code,
				value: p.id,
			})),
		[programs, locale],
	);
	const selected = options.find((o) => o.value === value) ?? null;

	// A school is selected but the org chart links no programs to it: the dropdown
	// would otherwise sit disabled with no explanation.
	const noProgramsForSchool = !isLoading && schoolId != null && options.length === 0;
	let placeholder: string;
	if (isLoading) {
		placeholder = t('loading.default');
	} else if (noProgramsForSchool) {
		placeholder = t('surveys.shared.noProgramsForSchool');
	} else {
		placeholder = t('surveys.shared.selectProgram');
	}

	return (
		<div className="max-w-xs">
			<Select
				label={t('surveys.shared.programLabel')}
				name="program"
				value={selected}
				options={options}
				isSearchable
				isClearable
				isDisabled={isLoading || options.length === 0}
				placeholder={placeholder}
				onChange={(_, sel) => {
					if (!sel || Array.isArray(sel)) {
						onChange(0);
						return;
					}
					onChange(Number(sel.value));
				}}
			/>
		</div>
	);
}
