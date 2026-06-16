'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { SurveyProgramSelect } from '../shared/SurveyProgramSelect';
import { LCFCReports } from './LCFCReports';
import { LCFCNotificationView } from './notifications/LCFCNotificationView';
import { LCFCConfiguration } from './configuration/LCFCConfiguration';

export function LCFCManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('reports');
	const [programId, setProgramId] = useState(0);

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
					<SurveyProgramSelect value={programId} onChange={setProgramId} />

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
