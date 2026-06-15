'use client';

import { useMemo } from 'react';
import { Select } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import { useProgramsByModality, type ProgramResponse } from '@/modules/academic';

interface Props {
	readonly value: number;
	readonly onChange: (programId: number) => void;
}

/**
 * Program picker shared by the survey screens. PPP and LCFC are outcome-based,
 * so they need a real programId; without it the backend has no outcomes/configs
 * to resolve and rejects the request.
 *
 * The program list is scoped to the active modality (the top-bar Modalidad
 * selector) via useProgramsByModality — the same source the Outcomes
 * maintenance screen uses, so the selected programId always matches a program
 * that can actually have outcomes registered.
 */
export function SurveyProgramSelect({ value, onChange }: Props) {
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
