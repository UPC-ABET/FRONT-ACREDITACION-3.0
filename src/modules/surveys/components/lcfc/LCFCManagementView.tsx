'use client';

import React, { useState } from 'react';
import { Tabs } from '@/shared/components';
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
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-zinc-900">
					LCFC — {t('surveys.lcfc.management.title')}
				</h1>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.lcfc.management.subtitle')}</p>
			</div>

			<SurveyProgramSelect value={programId} onChange={setProgramId} />

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'reports' && <LCFCReports programId={programId} />}
				{activeTab === 'notifications' && <LCFCNotificationView />}
				{activeTab === 'config' && <LCFCConfiguration programId={programId} />}
			</div>
		</div>
	);
}
