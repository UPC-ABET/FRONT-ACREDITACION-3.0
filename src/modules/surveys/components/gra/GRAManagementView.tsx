'use client';

import React, { useState } from 'react';
import { Tabs } from '@/shared/components';
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
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-zinc-900">
					GRA — {t('surveys.gra.management.title')}
				</h1>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.gra.management.subtitle')}</p>
			</div>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'reports' && <GRAReports />}
				{activeTab === 'notifications' && <GRANotificationView />}
				{activeTab === 'config' && <GRAConfiguration />}
			</div>
		</div>
	);
}
