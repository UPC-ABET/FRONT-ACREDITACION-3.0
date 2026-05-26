'use client';

import { useState } from 'react';
import { DEFAULT_PERFORMANCE_LEVEL_COLOR } from '../constants/performance-levels';
import type { PerformanceLevelFormState } from '../schemas/performance-level.schema';
import type { PerformanceLevelResponse } from '@/modules/academic/api/dtos';
import type { CreatePerformanceLevelDto } from '@/modules/academic/services/performanceLevelsService';

const EMPTY_FORM: PerformanceLevelFormState = {
	instrument_type_id: 0,
	academic_period_id: 0,
	name_es: '',
	name_en: '',
	code: '',
	unique_value: 0,
	min_score: 0,
	max_score: 0,
	max_value: 0,
	color: DEFAULT_PERFORMANCE_LEVEL_COLOR,
};

function round2(n: number): number {
	return Number(n.toFixed(2));
}

function levelToForm(level: PerformanceLevelResponse): PerformanceLevelFormState {
	return {
		instrument_type_id: level.instrument_type_id,
		academic_period_id: level.academic_period_id,
		name_es: level.name?.es ?? '',
		name_en: level.name?.en ?? '',
		code: level.code,
		unique_value: Number(level.unique_value),
		min_score: Number(level.min_score),
		max_score: Number(level.max_score),
		max_value: Number(level.max_value),
		color: (level.extra as { color?: string })?.color ?? DEFAULT_PERFORMANCE_LEVEL_COLOR,
	};
}

export function usePerformanceLevelForm() {
	const [form, setForm] = useState<PerformanceLevelFormState>(EMPTY_FORM);

	function resetForm() {
		setForm({ ...EMPTY_FORM });
	}

	function populateForm(level: PerformanceLevelResponse) {
		setForm(levelToForm(level));
	}

	function toDto(): CreatePerformanceLevelDto {
		return {
			instrument_type_id: form.instrument_type_id,
			academic_period_id: form.academic_period_id,
			name: { es: form.name_es, en: form.name_en },
			code: form.code,
			unique_value: round2(form.unique_value),
			min_score: round2(form.min_score),
			max_score: round2(form.max_score),
			max_value: round2(form.max_value),
			extra: { color: form.color },
		};
	}

	return { form, setForm, resetForm, populateForm, toDto };
}
