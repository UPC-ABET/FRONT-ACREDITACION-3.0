'use client';

import { useState } from 'react';
import { DEFAULT_PERFORMANCE_LEVEL_COLOR } from '../constants/performanceLevels';
import type { PerformanceLevelFormState } from '../schemas/performanceLevelSchema';
import type { CreatePerformanceLevelDto, PerformanceLevelResponse } from '../types';

const EMPTY_FORM: PerformanceLevelFormState = {
	instrumentTypeId: 0,
	academicPeriodId: 0,
	nameEs: '',
	nameEn: '',
	code: '',
	uniqueValue: '',
	minScore: '',
	maxScore: '',
	maxValue: '',
	color: DEFAULT_PERFORMANCE_LEVEL_COLOR,
};

function round2(n: number | ''): number {
	return Number((Number(n) || 0).toFixed(2));
}

function levelToForm(level: PerformanceLevelResponse): PerformanceLevelFormState {
	return {
		instrumentTypeId: level.instrumentTypeId,
		academicPeriodId: level.academicPeriodId,
		nameEs: level.name?.es ?? '',
		nameEn: level.name?.en ?? '',
		code: level.code,
		uniqueValue: Number(level.uniqueValue),
		minScore: Number(level.minScore),
		maxScore: Number(level.maxScore),
		maxValue: Number(level.maxValue),
		color: (level.extra as { color?: string })?.color ?? DEFAULT_PERFORMANCE_LEVEL_COLOR,
	};
}

export function usePerformanceLevelForm() {
	const [form, setForm] = useState<PerformanceLevelFormState>(EMPTY_FORM);

	function resetForm(academicPeriodId = 0) {
		setForm({ ...EMPTY_FORM, academicPeriodId });
	}

	function populateForm(level: PerformanceLevelResponse) {
		setForm(levelToForm(level));
	}

	function toDto(): CreatePerformanceLevelDto {
		return {
			instrumentTypeId: form.instrumentTypeId,
			academicPeriodId: form.academicPeriodId,
			name: { es: form.nameEs, en: form.nameEn },
			code: form.code,
			uniqueValue: round2(form.uniqueValue),
			minScore: round2(form.minScore),
			maxScore: round2(form.maxScore),
			maxValue: round2(form.maxValue),
			extra: { color: form.color },
		};
	}

	return { form, setForm, resetForm, populateForm, toDto };
}
