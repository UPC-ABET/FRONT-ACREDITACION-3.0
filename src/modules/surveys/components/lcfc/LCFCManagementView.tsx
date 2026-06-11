'use client';

import React, { useState } from 'react';
import { Tabs } from '@/shared/components';
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
			<div>
				<h1 className="text-2xl font-bold text-zinc-900">
					LCFC — {t('surveys.lcfc.management.title')}
				</h1>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.lcfc.management.subtitle')}</p>
			</div>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'reports' && <LCFCReports />}
				{activeTab === 'notifications' && <LCFCNotificationView />}
				{activeTab === 'config' && <LCFCConfiguration />}
			</div>
		</div>
	);
}
