'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n, useGlobalAcademicFiltersVisibilityOverride } from '@/providers';
import { GRAReports } from './GRAReports';
import { GRANotificationView } from './notifications/GRANotificationView';
import { GRAConfiguration } from './configuration/GRAConfiguration';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';

export function GRAManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('reports');
	const [programId, setProgramId] = useState(0);

	// Hide school filter — surveys show all programs across schools.
	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });

	const TABS = [
		{ id: 'reports', label: t('surveys.gra.management.tabReports') },
		{ id: 'notifications', label: t('surveys.gra.management.tabNotifications') },
		{ id: 'config', label: t('surveys.gra.management.tabConfig') },
	];

	return (
		<div className="w-full space-y-6">
			<PageHeader
				title={`GRA — ${t('surveys.gra.management.title')}`}
				description={t('surveys.gra.management.subtitle')}
			/>

			<AllProgramsSelect value={programId} onChange={setProgramId} />

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<Card className="overflow-visible">
				{activeTab === 'reports' && <GRAReports />}
				{activeTab === 'notifications' && (
					<GRANotificationView programId={programId || undefined} />
				)}
				{activeTab === 'config' && <GRAConfiguration programId={programId || undefined} />}
			</Card>
		</div>
	);
}
