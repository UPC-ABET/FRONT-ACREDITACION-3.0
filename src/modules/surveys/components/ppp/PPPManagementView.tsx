'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n, useGlobalAcademicFiltersVisibilityOverride } from '@/providers';
import { PPPMassiveUpload } from './PPPMassiveUpload';
import { PPPReports } from './PPPReports';
import { PPPConfiguration } from './configuration/PPPConfiguration';

// Each tab has its own career filter, so switching programs in one tab does not affect the
// others. The three ids live here rather than inside each tab because the tabs unmount when
// you switch away — holding them locally would reset the selection on every round trip.
export function PPPManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('upload');
	const [uploadProgramId, setUploadProgramId] = useState(0);
	const [reportsProgramId, setReportsProgramId] = useState(0);
	const [configProgramId, setConfigProgramId] = useState(0);

	// Hide school filter — surveys show all programs across schools.
	useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });

	// PPP does not send survey notifications — only GRA and LCFC do. The template
	// download already lives inside the massive-upload tab, so it has no tab of its own.
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
					{activeTab === 'upload' && (
						<PPPMassiveUpload programId={uploadProgramId} onProgramChange={setUploadProgramId} />
					)}
					{activeTab === 'reports' && (
						<PPPReports programId={reportsProgramId} onProgramChange={setReportsProgramId} />
					)}
					{activeTab === 'config' && (
						<PPPConfiguration programId={configProgramId} onProgramChange={setConfigProgramId} />
					)}
				</div>
			</Card>
		</div>
	);
}
