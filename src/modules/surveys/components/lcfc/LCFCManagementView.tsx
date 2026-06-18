'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n, useGlobalAcademicFiltersVisibilityOverride } from '@/providers';
import { LCFCProgramSelect } from '../shared/LCFCProgramSelect';
import { LCFCReports } from './LCFCReports';
import { LCFCNotificationView } from './notifications/LCFCNotificationView';
import { LCFCConfiguration } from './configuration/LCFCConfiguration';

export function LCFCManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('reports');
	const [programId, setProgramId] = useState(0);

	// Hide school filter — LCFC shows all programs across schools.
	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });

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
					<LCFCProgramSelect value={programId} onChange={setProgramId} />

					{activeTab === 'reports' && <LCFCReports programId={programId} />}
					{activeTab === 'notifications' && (
						<LCFCNotificationView programId={programId || undefined} />
					)}
					{activeTab === 'config' && <LCFCConfiguration programId={programId} />}
				</div>
			</Card>
		</div>
	);
}
