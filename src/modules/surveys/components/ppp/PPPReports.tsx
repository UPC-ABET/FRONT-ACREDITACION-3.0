'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select } from '@/shared/components';
import { useI18n, useABET } from '@/providers';
import { campusesService } from '@/modules/academic';
import { PerceptionReportPanel } from '../shared/PerceptionReportPanel';
import { generatePPPPerceptionPdf, listGRAOutcomes } from '../../services';

interface OptionItem {
	value: string | number;
	label: string;
}

interface PPPReportsProps {
	readonly programId: number;
}

export function PPPReports({ programId }: PPPReportsProps) {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);

	const { data: commissionOptions = [] } = useQuery({
		queryKey: ['ppp-commissions', programId],
		queryFn: () => listGRAOutcomes({ programId }),
		enabled: Boolean(programId),
		select: (groups) => groups.map((g) => ({ value: g.commissionId, label: g.commissionName })),
	});

	const { data: campusOptions = [] } = useQuery({
		queryKey: ['ppp-campuses'],
		queryFn: () => campusesService.getAll().then((res) => res.data ?? []),
		select: (campuses) =>
			campuses.map((item) => ({ value: item.id, label: item.name?.es ?? item.code })),
	});

	if (!academicPeriodId) {
		return <p className="text-sm text-zinc-500 italic">{t('surveys.shared.selectCycle')}</p>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-base font-bold text-zinc-800">{t('surveys.ppp.reports.title')}</h3>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.reports.description')}</p>
			</div>

			{/* Commission + campus filters */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
			</div>

			{/* Perception PDF report generator (no dashboard for PPP) */}
			<PerceptionReportPanel
				programId={programId || undefined}
				showSurveyNumber
				generate={generatePPPPerceptionPdf}
				externalFilters={{
					commissionId: commission ? Number(commission.value) : undefined,
					campusId: campus ? Number(campus.value) : undefined,
					lang: locale === 'en' ? 'en' : 'es',
				}}
			/>
		</div>
	);
}
