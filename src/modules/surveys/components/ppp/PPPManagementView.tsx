'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n, useGlobalAcademicFiltersVisibilityOverride } from '@/providers';
import { AllProgramsSelect } from '../shared/AllProgramsSelect';
import { PPPMassiveUpload } from './PPPMassiveUpload';
import { PPPReports } from './PPPReports';
import { PPPConfiguration } from './configuration/PPPConfiguration';

export function PPPManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('upload');
	const [programId, setProgramId] = useState(0);

	// Hide school filter — surveys show all programs across schools.
	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });

	const TABS = [
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
					{/* Program selector always visible across all tabs */}
					<AllProgramsSelect value={programId} onChange={setProgramId} />

					{activeTab === 'upload' && <PPPMassiveUpload programId={programId} />}
					{activeTab === 'reports' && <PPPReports programId={programId} />}
					{activeTab === 'config' && <PPPConfiguration programId={programId} />}
				</div>
			</Card>
		</div>
	);
}
