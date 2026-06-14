'use client';

import React, { useState } from 'react';
import { PageHeader, Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { PPPDownloadTemplate } from './PPPDownloadTemplate';
import { PPPMassiveUpload } from './PPPMassiveUpload';
import { PPPReports } from './PPPReports';
import { PPPConfiguration } from './configuration/PPPConfiguration';

export function PPPManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('download');

	const TABS = [
		{ id: 'download', label: t('surveys.ppp.management.tabDownload') },
		{ id: 'upload', label: t('surveys.ppp.management.tabUpload') },
		{ id: 'reports', label: t('surveys.ppp.management.tabReports') },
		{ id: 'config', label: t('surveys.ppp.management.tabConfig') },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={`PPP — ${t('surveys.ppp.management.title')}`}
				description={t('surveys.ppp.management.subtitle')}
			/>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'download' && <PPPDownloadTemplate />}
				{activeTab === 'upload' && <PPPMassiveUpload />}
				{activeTab === 'reports' && <PPPReports />}
				{activeTab === 'config' && <PPPConfiguration />}
			</div>
		</div>
	);
}
