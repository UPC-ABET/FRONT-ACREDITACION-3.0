'use client';

import { useState } from 'react';
import { PageHeader, Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { BannerManagementView } from '@/modules/banner';
import { PlannerManagementView } from '@/modules/planner';

type ScrapingTab = 'banner' | 'planner';

// /scrapping hosts both scraping sources as tabs: Banner (sections/enrollment/students/
// teachers) and Planner (evaluations/grades). They share the SCRAPPING permission.
export function ScrapingTabsView() {
	const { t } = useI18n();
	const [tab, setTab] = useState<ScrapingTab>('banner');

	const tabs = [
		{ id: 'banner', label: t('scraping.tabs.banner') },
		{ id: 'planner', label: t('scraping.tabs.planner') },
	];

	return (
		<div className="w-full space-y-6">
			<PageHeader title={t('scraping.title')} description={t('scraping.subtitle')} />
			<Tabs tabs={tabs} activeTab={tab} onChange={(id) => setTab(id as ScrapingTab)} />
			{tab === 'banner' ? <BannerManagementView /> : <PlannerManagementView />}
		</div>
	);
}
