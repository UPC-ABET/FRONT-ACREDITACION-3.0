'use client';

import { PageHeader, Tabs } from '@/shared/components';
import { useTabParam } from '@/shared';
import { useI18n } from '@/providers';
import { BannerManagementView } from '@/modules/banner';
import { PlannerManagementView } from '@/modules/planner';
import { ScrapingExportsView } from '@/modules/scraping-exports';

// /scrapping hosts both scraping sources as tabs: Banner (sections/enrollment/students/
// teachers) and Planner (evaluations/grades), plus Exports (the upload-ready Excels built from
// the scraped data). They share the SCRAPPING permission.
export function ScrapingTabsView() {
	const { t } = useI18n();
	const [tab, setTab] = useTabParam('banner');

	const tabs = [
		{ id: 'banner', label: t('scraping.tabs.banner') },
		{ id: 'planner', label: t('scraping.tabs.planner') },
		{ id: 'exports', label: t('scraping.tabs.exports') },
	];

	return (
		<div className="w-full space-y-6">
			<PageHeader title={t('scraping.title')} description={t('scraping.subtitle')} />
			<Tabs tabs={tabs} activeTab={tab} onChange={setTab} />
			{tab === 'banner' && <BannerManagementView />}
			{tab === 'planner' && <PlannerManagementView />}
			{tab === 'exports' && <ScrapingExportsView />}
		</div>
	);
}
