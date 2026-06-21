'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { programsQueryKeys, programsService, type ProgramResponse } from '@/modules/academic';

interface Props {
	readonly value: number;
	readonly onChange: (programId: number) => void;
}

/**
 * Program picker for the survey screens (LCFC, GRA, PPP). Unlike SurveyProgramSelect
 * it does NOT filter by school, so all active programs across all schools are
 * available. Surveys hide the sidebar school filter and list every program, because
 * a section/student can belong to programs from different schools.
 */
export function AllProgramsSelect({ value, onChange }: Props) {
	const { t, locale } = useI18n();
	const { data: programs = [], isLoading } = useQuery({
		queryKey: programsQueryKeys.allActive(),
		queryFn: () => programsService.getByFilters({ isActive: true }).then((r) => r.data ?? []),
		staleTime: Infinity,
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

	return (
		<div className="max-w-xs">
			<Select
				label={t('surveys.shared.programLabel')}
				name="program"
				value={selected}
				options={options}
				isSearchable
				isClearable
				isDisabled={isLoading}
				placeholder={isLoading ? t('loading.default') : t('surveys.shared.selectProgram')}
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
