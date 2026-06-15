'use client';

import React, { useState } from 'react';
import { Tabs } from '@/shared/components';
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
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-zinc-900">
					PPP — {t('surveys.ppp.management.title')}
				</h1>
				<p className="text-sm text-zinc-500 mt-1">{t('surveys.ppp.management.subtitle')}</p>
			</div>

			<SurveyProgramSelect value={programId} onChange={setProgramId} />

			<Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

			<div className="pt-2">
				{activeTab === 'download' && <PPPDownloadTemplate programId={programId} />}
				{activeTab === 'upload' && <PPPMassiveUpload programId={programId} />}
				{activeTab === 'reports' && <PPPReports programId={programId} />}
				{activeTab === 'config' && <PPPConfiguration programId={programId} />}
			</div>
		</div>
	);
}
