'use client';

import React, { useState } from 'react';
import { PageHeader, Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { LCFCReports } from './LCFCReports';
import { LCFCNotificationView } from './notifications/LCFCNotificationView';
import { LCFCConfiguration } from './configuration/LCFCConfiguration';

export function LCFCManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('reports');

	const TABS = [
		{ id: 'reports', label: t('surveys.lcfc.management.tabReports') },
		{ id: 'notifications', label: t('surveys.lcfc.management.tabNotifications') },
		{ id: 'config', label: t('surveys.lcfc.management.tabConfig') },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={`LCFC — ${t('surveys.lcfc.management.title')}`}
				description={t('surveys.lcfc.management.subtitle')}
			/>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'reports' && <LCFCReports />}
				{activeTab === 'notifications' && <LCFCNotificationView />}
				{activeTab === 'config' && <LCFCConfiguration />}
			</div>
		</div>
	);
}
