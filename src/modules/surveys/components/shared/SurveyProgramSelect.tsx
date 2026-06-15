'use client';

import { useEffect, useState } from 'react';
import { Select } from '@/shared/components';
import { useI18n } from '@/providers';
import { getPrograms } from '../../services';
import type { Program } from '../../types';

interface Props {
	readonly value: number;
	readonly onChange: (programId: number) => void;
}

/**
 * Program picker shared by the survey screens. PPP and LCFC are outcome-based,
 * so they need a real programId; without it the backend has no outcomes/configs
 * to resolve and rejects the request.
 */
export function SurveyProgramSelect({ value, onChange }: Props) {
	const { t } = useI18n();
	const [programs, setPrograms] = useState<Program[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		getPrograms()
			.then((list) => {
				if (active) setPrograms(list);
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, []);

	const options = programs.map((p) => ({
		label: p.code ? `${p.name} (${p.code})` : p.name,
		value: p.id,
	}));
	const selected = options.find((o) => o.value === value) ?? null;

	return (
		<div className="max-w-xs">
			<Select
				label={t('surveys.shared.programLabel')}
				name="program"
				value={selected}
				options={options}
				isSearchable
				isDisabled={loading || options.length === 0}
				placeholder={loading ? t('loading.default') : t('surveys.shared.selectProgram')}
				onChange={(_, sel) => {
					if (!sel || Array.isArray(sel)) return;
					onChange(Number(sel.value));
				}}
			/>
		</div>
	);
}
