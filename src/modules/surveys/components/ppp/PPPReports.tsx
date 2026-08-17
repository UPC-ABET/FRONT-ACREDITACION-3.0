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
import { CommissionCampusFilters } from '../shared/CommissionCampusFilters';
import { useSurveyFilterOptions } from '../../hooks';
import { generatePPPPerceptionPdf } from '../../services';
import type { OptionItem } from '../../types';

interface PPPReportsProps {
	/** Owned by PPPManagementView so the selection survives switching tabs. */
	readonly programId: number;
	readonly onProgramChange: (programId: number) => void;
}

export function PPPReports({ programId, onProgramChange }: PPPReportsProps) {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);
	const [surveyNumbers, setSurveyNumbers] = useState<OptionItem[]>([]);
	// Only the value is state — storing the whole option would freeze its label at the
	// mount-time locale.
	const [lang, setLang] = useState<'es' | 'en'>('es');
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
				<AllProgramsSelect value={programId} onChange={onProgramChange} wrapperClassName="" />
				<CommissionCampusFilters
					className="contents"
					namePrefix="ppp-"
					commissionOptions={commissionOptions}
					campusOptions={campusOptions}
					commission={commission}
					campus={campus}
					onCommissionChange={setCommission}
					onCampusChange={setCampus}
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
					value={languageOptions.find((option) => option.value === lang) ?? languageOptions[0]}
					onChange={(_name, value) => {
						if (!value || Array.isArray(value)) return;
						setLang(value.value === 'en' ? 'en' : 'es');
					}}
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
					lang,
				}}
			/>
		</div>
	);
}
