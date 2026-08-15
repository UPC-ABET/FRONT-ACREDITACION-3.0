'use client';

import React, { useState } from 'react';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n, useGlobalAcademicFiltersVisibilityOverride } from '@/providers';
import { PPPMassiveUpload } from './PPPMassiveUpload';
import { PPPReports } from './PPPReports';
import { PPPConfiguration } from './configuration/PPPConfiguration';

// Each tab owns its own independent career filter, same as GRA/LCFC, so switching
// programs in one tab does not affect the others.
export function PPPManagementView() {
	const { t } = useI18n();
	const [activeTab, setActiveTab] = useState('upload');

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
					{activeTab === 'upload' && <PPPMassiveUpload />}
					{activeTab === 'reports' && <PPPReports />}
					{activeTab === 'config' && <PPPConfiguration />}
				</div>
			</Card>
		</div>
	);
}
