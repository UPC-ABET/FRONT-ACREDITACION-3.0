'use client';

import React, { useRef, useState } from 'react';
import { Button, Select } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import {
	PerceptionReportPanel,
	SURVEY_NUMBER_OPTIONS,
	type PerceptionReportPanelHandle,
} from '../shared/PerceptionReportPanel';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { useSurveyFilterOptions } from '../../hooks';
import { generatePPPPerceptionPdf } from '../../services';
import type { OptionItem } from '../../types';

export function PPPReports() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [programId, setProgramId] = useState(0);
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [surveyNumbers, setSurveyNumbers] = useState<OptionItem[]>([]);
	const [language, setLanguage] = useState<OptionItem>({
		value: 'es',
		label: t('surveys.perception.spanish'),
	});
	const [generating, setGenerating] = useState(false);
	const panelRef = useRef<PerceptionReportPanelHandle>(null);

	const { commissionOptions, campusOptions } = useSurveyFilterOptions(programId);

	const languageOptions: OptionItem[] = [
		{ value: 'es', label: t('surveys.perception.spanish') },
		{ value: 'en', label: t('surveys.perception.english') },
	];

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<AllProgramsSelect value={programId} onChange={setProgramId} wrapperClassName="" />
				<Select
					name="ppp-commission"
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
					name="ppp-campus"
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
				<Select
					name="ppp-survey-numbers"
					label={t('surveys.perception.surveyNumber')}
					placeholder={t('surveys.perception.allSurveyNumbers')}
					isMulti
					options={SURVEY_NUMBER_OPTIONS}
					value={surveyNumbers}
					onChange={(_name, value) =>
						setSurveyNumbers(Array.isArray(value) ? (value as OptionItem[]) : [])
					}
				/>
				<Select
					name="ppp-language"
					label={t('surveys.perception.language')}
					options={languageOptions}
					value={language}
					onChange={(_name, value) =>
						value && !Array.isArray(value) && setLanguage(value as OptionItem)
					}
				/>
			</div>

			<div className="flex items-start justify-between gap-3">
				<div>
					<h3 className="text-base font-bold text-zinc-800">{t('surveys.ppp.reports.title')}</h3>
					<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.reports.description')}</p>
				</div>
				<Button
					onClick={() => panelRef.current?.generate()}
					disabled={generating}
					loading={generating}>
					{t('surveys.perception.generate')}
				</Button>
			</div>

			<PerceptionReportPanel
				ref={panelRef}
				hideGenerateButton
				onGeneratingChange={setGenerating}
				programId={programId || undefined}
				showSurveyNumber
				allowUnfiltered
				generate={generatePPPPerceptionPdf}
				externalFilters={{
					commissionId: commission ? Number(commission.value) : undefined,
					campusId: campus ? Number(campus.value) : undefined,
					surveyNumbers: surveyNumbers.map((option) => Number(option.value)),
					lang: language.value === 'en' ? 'en' : 'es',
				}}
			/>
		</div>
	);
}
