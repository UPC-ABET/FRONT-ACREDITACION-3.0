'use client';

import { useEffect, useMemo } from 'react';
import { Select } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useProgramsByModality, type ProgramResponse } from '@/modules/academic';

interface Props {
	readonly value: number;
	readonly onChange: (programId: number) => void;
	readonly wrapperClassName?: string;
}

/**
 * Program picker for the survey screens (LCFC, GRA, PPP). Unlike SurveyProgramSelect
 * it does NOT filter by school, so all programs across all schools are available.
 * It DOES follow the global modality selector (Regular/EPE): only programs of the
 * active modality are listed, since surveys are always managed per modality.
 */
export function AllProgramsSelect({ value, onChange, wrapperClassName = 'max-w-xs' }: Props) {
	const { t, locale } = useI18n();
	const { modalityTypeId } = useABET();
	const { data: programs = [], isLoading } = useProgramsByModality(modalityTypeId);

	const options = useMemo(
		() =>
			programs.map((p: ProgramResponse) => ({
				label: p.name[locale] ?? p.name.es ?? p.code,
				value: p.id,
			})),
		[programs, locale],
	);
	const selected = options.find((o) => o.value === value) ?? null;

	// A modality switch can leave a program of the other modality selected upstream;
	// clear it so the tabs don't keep filtering by an invisible program.
	useEffect(() => {
		if (!isLoading && value && options.length > 0 && !options.some((o) => o.value === value)) {
			onChange(0);
		}
	}, [isLoading, value, options, onChange]);

	return (
		<div className={wrapperClassName}>
			<Select
				label={t('surveys.shared.programLabel')}
				name="program"
				value={selected}
				options={options}
				isSearchable
				isClearable
				isDisabled={isLoading || modalityTypeId == null}
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
