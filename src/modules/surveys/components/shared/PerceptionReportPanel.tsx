'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Select, Toast } from '@/shared/components';
import { ArrowDownTrayIcon, EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import { campusesService } from '@/modules/academic';
import { listGRAOutcomes } from '../../services/graService';
import type {
	PerceptionReportFilters,
	PerceptionReportResponse,
	PerceptionReportFile,
} from '../../types';

interface OptionItem {
	value: string | number;
	label: string;
}

export interface PerceptionReportPanelProps {
	programId?: number;
	/** PPP exposes a "survey number" (practice number) multi-select; GRA/LCFC do not. */
	showSurveyNumber?: boolean;
	generate: (
		filters: PerceptionReportFilters & { programId?: number },
	) => Promise<PerceptionReportResponse>;
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

export function PerceptionReportPanel({
	programId,
	showSurveyNumber = false,
	generate,
}: PerceptionReportPanelProps) {
	const { t } = useI18n();
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [surveyNumbers, setSurveyNumbers] = useState<OptionItem[]>([]);
	const [language, setLanguage] = useState<OptionItem>({
		value: 'es',
		label: t('surveys.perception.spanish'),
	});
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<PerceptionReportResponse | null>(null);
	const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; msg: string }>({
		open: false,
		type: 'success',
		msg: '',
	});

	const { data: commissionOptions = [] } = useQuery({
		queryKey: ['perception-commissions', programId],
		queryFn: () => listGRAOutcomes({ programId: programId as number }),
		enabled: Boolean(programId),
		select: (groups) =>
			groups.map((group) => ({ value: group.commissionId, label: group.commissionName })),
	});

	const { data: campusOptions = [] } = useQuery({
		queryKey: ['perception-campuses'],
		queryFn: () => campusesService.getAll().then((response) => response.data ?? []),
		select: (campuses) =>
			campuses.map((item) => ({ value: item.id, label: item.name?.es ?? item.code })),
	});

	const languageOptions: OptionItem[] = [
		{ value: 'es', label: t('surveys.perception.spanish') },
		{ value: 'en', label: t('surveys.perception.english') },
	];

	async function handleGenerate() {
		if (!programId) {
			setToast({ open: true, type: 'error', msg: t('surveys.shared.selectProgram') });
			return;
		}
		setLoading(true);
		setResult(null);
		try {
			const response = await generate({
				programId,
				commissionId: commission ? Number(commission.value) : undefined,
				campusId: campus ? Number(campus.value) : undefined,
				surveyNumbers: showSurveyNumber
					? surveyNumbers.map((option) => Number(option.value))
					: undefined,
				lang: language.value === 'en' ? 'en' : 'es',
			});
			setResult(response);
			if (response.reports.length === 0) {
				setToast({ open: true, type: 'error', msg: t('surveys.perception.empty') });
			}
		} catch (error) {
			setToast({ open: true, type: 'error', msg: tryTranslate(t, getErrorMessage(error)) });
		} finally {
			setLoading(false);
		}
	}

	function viewReport(file: PerceptionReportFile) {
		const url = URL.createObjectURL(base64ToBlob(file.base64, 'application/pdf'));
		window.open(url, '_blank', 'noopener');
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
			<Card className="p-5 space-y-4">
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
				<div className="flex justify-end">
					<Button onClick={handleGenerate} disabled={loading} loading={loading}>
						{t('surveys.perception.generate')}
					</Button>
				</div>
			</Card>

			{result && result.reports.length > 0 && (
				<Card className="p-5 space-y-3">
					<div className="flex items-center justify-between gap-3">
						<h3 className="text-base font-bold text-zinc-800">
							{t('surveys.perception.results')}
						</h3>
						{result.zip && (
							<Button size="sm" variant="surface" onClick={downloadZip}>
								<DocumentArrowDownIcon className="h-4 w-4 mr-1" />
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
										<EyeIcon className="h-4 w-4 mr-1" />
										{t('surveys.perception.view')}
									</Button>
									<Button size="sm" variant="surface" onClick={() => downloadReport(file)}>
										<ArrowDownTrayIcon className="h-4 w-4 mr-1" />
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
}
