'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { GRAReports } from './GRAReports';
import { GRANotificationView } from './notifications/GRANotificationView';
import { GRAConfiguration } from './configuration/GRAConfiguration';

export function GRAManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('reports');

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

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<Card className="overflow-visible">
				{activeTab === 'reports' && <GRAReports />}
				{activeTab === 'notifications' && <GRANotificationView />}
				{activeTab === 'config' && <GRAConfiguration />}
			</Card>
		</div>
	);
}
