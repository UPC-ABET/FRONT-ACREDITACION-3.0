'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs, Select } from '@/shared/components';
import { useI18n, useGlobalAcademicFiltersVisibilityOverride } from '@/providers';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { LCFCReports } from './LCFCReports';
import { LCFCNotificationView } from './notifications/LCFCNotificationView';
import { LCFCConfiguration } from './configuration/LCFCConfiguration';
import { useSurveyFilterOptions } from '../../hooks';
import type { OptionItem } from '../../types';

export function LCFCManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('reports');
	const [programId, setProgramId] = useState(0);
	const [commission, setCommission] = useState<OptionItem | null>(null);
	const [campus, setCampus] = useState<OptionItem | null>(null);

	// Hide school filter — LCFC shows all programs across schools.
	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });

	const { commissionOptions, campusOptions } = useSurveyFilterOptions(programId);

	const TABS = [
		{ id: 'reports', label: t('surveys.lcfc.management.tabReports') },
		{ id: 'notifications', label: t('surveys.lcfc.management.tabNotifications') },
		{ id: 'config', label: t('surveys.lcfc.management.tabConfig') },
	];

	return (
		<div className="w-full space-y-6">
			<PageHeader
				title={`LCFC — ${t('surveys.lcfc.management.title')}`}
				description={t('surveys.lcfc.management.subtitle')}
			/>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<Card className="overflow-visible">
				<div className="space-y-6">
					{/* Commission and campus filters only apply to reports. Configuration and
					    notifications are filtered by career only (no career selected = all careers). */}
					<div
						className={`grid grid-cols-1 gap-4 ${activeTab === 'reports' ? 'md:grid-cols-3' : ''}`}>
						<AllProgramsSelect value={programId} onChange={setProgramId} wrapperClassName="" />
						{activeTab === 'reports' && (
							<>
								<Select
									name="lcfc-commission"
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
									name="lcfc-campus"
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
							</>
						)}
					</div>

					{activeTab === 'reports' && (
						<LCFCReports
							programId={programId}
							commissionId={commission ? Number(commission.value) : undefined}
							campusId={campus ? Number(campus.value) : undefined}
						/>
					)}
					{activeTab === 'notifications' && (
						<LCFCNotificationView programId={programId || undefined} />
					)}
					{activeTab === 'config' && <LCFCConfiguration programId={programId} />}
				</div>
			</Card>
		</div>
	);
}
