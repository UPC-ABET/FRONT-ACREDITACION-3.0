'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { SurveyProgramSelect } from '../shared/SurveyProgramSelect';
import { PPPDownloadTemplate } from './PPPDownloadTemplate';
import { PPPMassiveUpload } from './PPPMassiveUpload';
import { PPPReports } from './PPPReports';
import { PPPConfiguration } from './configuration/PPPConfiguration';

export function PPPManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('download');
	const [programId, setProgramId] = useState(0);

	const TABS = [
		{ id: 'download', label: t('surveys.ppp.management.tabDownload') },
		{ id: 'upload', label: t('surveys.ppp.management.tabUpload') },
		{ id: 'reports', label: t('surveys.ppp.management.tabReports') },
		{ id: 'config', label: t('surveys.ppp.management.tabConfig') },
	];

	return (
		<div className="w-full space-y-6">
			<PageHeader
				title={`PPP — ${t('surveys.ppp.management.title')}`}
				description={t('surveys.ppp.management.subtitle')}
			/>

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<Card className="overflow-visible">
				<div className="space-y-6">
					<SurveyProgramSelect value={programId} onChange={setProgramId} />

					{activeTab === 'download' && <PPPDownloadTemplate programId={programId} />}
					{activeTab === 'upload' && <PPPMassiveUpload programId={programId} />}
					{activeTab === 'reports' && <PPPReports programId={programId} />}
					{activeTab === 'config' && <PPPConfiguration programId={programId} />}
				</div>
			</Card>
		</div>
	);
}
