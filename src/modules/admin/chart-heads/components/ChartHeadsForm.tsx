'use client';

import { useRef, useState } from 'react';
import { Button } from '@/shared/components';
import { ApiError } from '@/shared/lib';
import { getErrorMessage } from '@/shared/lib/apiError';
import { useI18n } from '@/providers';
import { useLanguages } from '@/shared/hooks';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useConfigureChartHeads } from '../hooks';
import {
	configToFormValue,
	emptyDirector,
	formToPayload,
	validateChartHeadsForm,
} from '../schemas';
import type {
	ChartHeadsConfig,
	ChartHeadsFormErrors,
	ChartHeadsFormValue,
	DirectorFormValue,
	HeadFormValue,
	SchoolOption,
	UserOption,
} from '../types';
import { DeanSection } from './DeanSection';
import { DirectorsSection } from './DirectorsSection';

interface Props {
	academicPeriodId: number;
	config: ChartHeadsConfig;
	schoolOptions: SchoolOption[];
	schoolsLoading: boolean;
	userOptions: UserOption[];
	usersLoading: boolean;
	onSuccess: (message: string) => void;
	onError: (message: string) => void;
}

const EMPTY_ERRORS: ChartHeadsFormErrors = { directors: {} };

function extractErrorDetails(error: unknown): string[] {
	if (error instanceof ApiError && error.body && typeof error.body === 'object') {
		const data = (error.body as { data?: unknown }).data;
		if (Array.isArray(data)) return data.filter((item): item is string => typeof item === 'string');
	}
	return [];
}

export function ChartHeadsForm({
	academicPeriodId,
	config,
	schoolOptions,
	schoolsLoading,
	userOptions,
	usersLoading,
	onSuccess,
	onError,
}: Props) {
	const { t } = useI18n();
	const languages = useLanguages();
	const configure = useConfigureChartHeads();
	const nextDirectorKey = useRef(0);

	const [form, setForm] = useState<ChartHeadsFormValue>(() => configToFormValue(config, languages));
	const [errors, setErrors] = useState<ChartHeadsFormErrors>(EMPTY_ERRORS);

	const setDean = (dean: HeadFormValue) => setForm((prev) => ({ ...prev, dean }));

	const setDirector = (key: string, next: DirectorFormValue) =>
		setForm((prev) => ({
			...prev,
			directors: prev.directors.map((director) => (director.key === key ? next : director)),
		}));

	const addDirector = () => {
		nextDirectorKey.current += 1;
		setForm((prev) => ({
			...prev,
			directors: [...prev.directors, emptyDirector(`new-${nextDirectorKey.current}`, languages)],
		}));
	};

	const removeDirector = (key: string) =>
		setForm((prev) => ({
			...prev,
			directors: prev.directors.filter((director) => director.key !== key),
		}));

	const handleSave = async () => {
		const { errors: validationErrors, isValid } = validateChartHeadsForm(form, languages);
		setErrors(validationErrors);
		if (!isValid) return;

		try {
			const saved = await configure.mutateAsync(formToPayload(academicPeriodId, form));
			setForm(configToFormValue(saved, languages));
			setErrors(EMPTY_ERRORS);
			onSuccess(t('admin.chartHeads.toast.saved'));
		} catch (error) {
			const details = extractErrorDetails(error);
			const baseMessage = tryTranslate(
				t,
				getErrorMessage(error, 'admin.chartHeads.error.saveFailed'),
			);
			const detailMessage = details.map((key) => tryTranslate(t, key)).join(', ');
			onError(detailMessage ? `${baseMessage}: ${detailMessage}` : baseMessage);
		}
	};

	return (
		<div className="space-y-6">
			<DeanSection
				value={form.dean}
				onChange={setDean}
				errors={errors.dean}
				userOptions={userOptions}
				usersLoading={usersLoading}
				disabled={configure.isPending}
			/>

			<DirectorsSection
				directors={form.directors}
				onChange={setDirector}
				onAdd={addDirector}
				onRemove={removeDirector}
				errors={errors.directors}
				schoolOptions={schoolOptions}
				schoolsLoading={schoolsLoading}
				userOptions={userOptions}
				usersLoading={usersLoading}
				disabled={configure.isPending}
			/>

			<div className="flex justify-end">
				<Button variant="primary" size="lg" disabled={configure.isPending} onClick={handleSave}>
					{configure.isPending ? t('loading.default') : t('admin.chartHeads.btn.save')}
				</Button>
			</div>
		</div>
	);
}
