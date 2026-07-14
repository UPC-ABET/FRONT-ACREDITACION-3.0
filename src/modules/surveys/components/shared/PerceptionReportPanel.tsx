'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, Button, Select, Toast } from '@/shared/components';
import { ArrowDownTrayIcon, EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import { useSurveyFilterOptions } from '../../hooks';
import type {
	OptionItem,
	PerceptionReportFilters,
	PerceptionReportResponse,
	PerceptionReportFile,
} from '../../types';

export interface PerceptionReportPanelProps {
	programId?: number;
	showSurveyNumber?: boolean;
	externalFilters?: {
		commissionId?: number;
		campusId?: number;
		lang?: 'es' | 'en';
	};
	hideGenerateButton?: boolean;
	requireCommission?: boolean;
	/** When no program/commission/campus is selected, skip validation and generate anyway
	 *  (the backend returns a per-program overview report in that case). */
	allowUnfiltered?: boolean;
	onGeneratingChange?: (generating: boolean) => void;
	generate: (
		filters: PerceptionReportFilters & { programId?: number },
	) => Promise<PerceptionReportResponse>;
}

export interface PerceptionReportPanelHandle {
	generate: () => void;
}

const SURVEY_NUMBER_OPTIONS: OptionItem[] = [
	{ value: 1, label: '1' },
	{ value: 2, label: '2' },
];

function base64ToBlob(base64: string, type: string): Blob {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
	return new Blob([bytes], { type });
}

function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

export const PerceptionReportPanel = forwardRef<
	PerceptionReportPanelHandle,
	PerceptionReportPanelProps
>(function PerceptionReportPanel(
	{
		programId,
		showSurveyNumber = false,
		externalFilters,
		hideGenerateButton,
		requireCommission,
		allowUnfiltered,
		onGeneratingChange,
		generate,
	},
	ref,
) {
	const { t, locale } = useI18n();
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [surveyNumbers, setSurveyNumbers] = useState<OptionItem[]>([]);
	const [language, setLanguage] = useState<OptionItem>({
		value: 'es',
		label: t('surveys.perception.spanish'),
	});
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const { commissionOptions, campusOptions } = useSurveyFilterOptions(programId);

	const languageOptions: OptionItem[] = [
		{ value: 'es', label: t('surveys.perception.spanish') },
		{ value: 'en', label: t('surveys.perception.english') },
	];

	const generateMutation = useMutation({
		mutationFn: generate,
		onSuccess: (response) => {
			if (response.reports.length === 0) {
				setToast({ open: true, type: 'error', msg: t('surveys.perception.empty') });
			}
		},
		onError: (error) => {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, getErrorMessage(error)) });
		},
	});
	const result = generateMutation.data;

	useImperativeHandle(ref, () => ({ generate: handleGenerate }));

	useEffect(() => {
		onGeneratingChange?.(generateMutation.isPending);
	}, [generateMutation.isPending, onGeneratingChange]);

	function handleGenerate() {
		const resolvedCommissionId = externalFilters
			? externalFilters.commissionId
			: commission
				? Number(commission.value)
				: undefined;
		const resolvedCampusId = externalFilters
			? externalFilters.campusId
			: campus
				? Number(campus.value)
				: undefined;
		const unfiltered = !programId && !resolvedCommissionId && !resolvedCampusId;
		if (!(allowUnfiltered && unfiltered)) {
			if (!programId) {
				setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
				return;
			}
			if (requireCommission && !resolvedCommissionId) {
				setToast({ open: true, type: 'error', msg: t('surveys.perception.commissionRequired') });
				return;
			}
		}
		const resolvedLang: 'es' | 'en' = externalFilters
			? (externalFilters.lang ?? (locale === 'en' ? 'en' : 'es'))
			: language.value === 'en'
				? 'en'
				: 'es';
		generateMutation.mutate({
			programId,
			commissionId: resolvedCommissionId,
			campusId: resolvedCampusId,
			surveyNumbers: showSurveyNumber
				? surveyNumbers.map((option) => Number(option.value))
				: undefined,
			lang: resolvedLang,
		});
	}

	function viewReport(file: PerceptionReportFile) {
		const url = URL.createObjectURL(base64ToBlob(file.base64, 'application/pdf'));
		window.open(url, '_blank', 'noopener');
		setTimeout(() => URL.revokeObjectURL(url), 60_000);
	}

	function downloadReport(file: PerceptionReportFile) {
		downloadBlob(base64ToBlob(file.base64, 'application/pdf'), file.filename);
	}

	function downloadZip() {
		if (!result?.zip) return;
		downloadBlob(base64ToBlob(result.zip.base64, 'application/zip'), result.zip.filename);
	}

	return (
		<div className="space-y-6">
			{(!hideGenerateButton || !externalFilters) && (
				<Card className="p-5 space-y-4">
					{!externalFilters && (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Select
								name="commission"
								label={t('surveys.perception.commission')}
								placeholder={t('surveys.perception.allCommissions')}
								isClearable
								isSearchable
								options={commissionOptions}
								value={commission}
								onChange={(_name, value) =>
									setCommission(value && !Array.isArray(value) ? (value as OptionItem) : null)
								}
							/>
							<Select
								name="campus"
								label={t('surveys.perception.campus')}
								placeholder={t('surveys.perception.allCampuses')}
								isClearable
								isSearchable
								options={campusOptions}
								value={campus}
								onChange={(_name, value) =>
									setCampus(value && !Array.isArray(value) ? (value as OptionItem) : null)
								}
							/>
							{showSurveyNumber && (
								<Select
									name="surveyNumbers"
									label={t('surveys.perception.surveyNumber')}
									placeholder={t('surveys.perception.allSurveyNumbers')}
									isMulti
									options={SURVEY_NUMBER_OPTIONS}
									value={surveyNumbers}
									onChange={(_name, value) =>
										setSurveyNumbers(Array.isArray(value) ? (value as OptionItem[]) : [])
									}
								/>
							)}
							<Select
								name="language"
								label={t('surveys.perception.language')}
								options={languageOptions}
								value={language}
								onChange={(_name, value) =>
									value && !Array.isArray(value) && setLanguage(value as OptionItem)
								}
							/>
						</div>
					)}
					{!hideGenerateButton && (
						<div className="flex justify-end">
							<Button
								onClick={handleGenerate}
								disabled={generateMutation.isPending}
								loading={generateMutation.isPending}>
								{t('surveys.perception.generate')}
							</Button>
						</div>
					)}
				</Card>
			)}

			{result && result.reports.length > 0 && (
				<Card className="p-5 space-y-3">
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-base font-bold text-zinc-800">{t('surveys.perception.results')}</h3>
						{result.zip && (
							<Button size="sm" variant="surface" onClick={downloadZip}>
								<DocumentArrowDownIcon className="h-4 w-4 mr-1" aria-hidden="true" />
								{t('surveys.perception.downloadZip')}
							</Button>
						)}
					</div>
					<ul className="divide-y divide-zinc-100">
						{result.reports.map((file) => (
							<li
								key={file.filename}
								className="flex items-center justify-between gap-3 py-2.5 text-sm">
								<span className="truncate text-zinc-700">{file.filename}</span>
								<div className="flex shrink-0 gap-2">
									<Button size="sm" variant="surface" onClick={() => viewReport(file)}>
										<EyeIcon className="h-4 w-4 mr-1" aria-hidden="true" />
										{t('surveys.perception.view')}
									</Button>
									<Button size="sm" variant="surface" onClick={() => downloadReport(file)}>
										<ArrowDownTrayIcon className="h-4 w-4 mr-1" aria-hidden="true" />
										{t('surveys.perception.download')}
									</Button>
								</div>
							</li>
						))}
					</ul>
				</Card>
			)}

			<Toast
				isOpen={toast.open}
				type={toast.type}
				message={toast.msg}
				onClose={() => setToast({ ...toast, open: false })}
			/>
		</div>
	);
});
