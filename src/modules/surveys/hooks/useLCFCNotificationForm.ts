'use client';

import { useState } from 'react';

export interface LCFCNotificationFormState {
	selectedCycle: { label: string; value: number } | null;
	surveyBaseUrl: string;
	maxRegisterDate: string;
}

const INITIAL_STATE: LCFCNotificationFormState = {
	selectedCycle: null,
	surveyBaseUrl: '',
	maxRegisterDate: '',
};

export function useLCFCNotificationForm() {
	const [form, setForm] = useState<LCFCNotificationFormState>(INITIAL_STATE);

	const isValid =
		form.selectedCycle !== null &&
		form.surveyBaseUrl.trim().length > 0 &&
		form.maxRegisterDate.length > 0;

	function setSelectedCycle(cycle: { label: string; value: number } | null) {
		setForm((prev) => ({ ...prev, selectedCycle: cycle }));
	}

	function setSurveyBaseUrl(url: string) {
		setForm((prev) => ({ ...prev, surveyBaseUrl: url }));
	}

	function setMaxRegisterDate(date: string) {
		setForm((prev) => ({ ...prev, maxRegisterDate: date }));
	}

	function reset() {
		setForm(INITIAL_STATE);
	}

	return {
		form,
		isValid,
		setSelectedCycle,
		setSurveyBaseUrl,
		setMaxRegisterDate,
		reset,
	};
}
