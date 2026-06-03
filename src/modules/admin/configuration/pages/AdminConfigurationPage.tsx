'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { ChartHeadsConfigPage } from '@/modules/admin/chart-heads';
import { PeriodsTab, ProgramCommissionsTab } from '../components';

const DEFAULT_TAB = 'periods';

export default function AdminConfigurationPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useI18n();

	const activeTab = searchParams.get('tab') ?? DEFAULT_TAB;

	const topTabs = [
		{ id: 'periods', label: t('admin.configuration.tabs.periods') },
		{ id: 'program-commissions', label: t('admin.configuration.tabs.programCommissions') },
		{ id: 'chart-heads', label: t('admin.configuration.tabs.chartHeads') },
	];

	const setTab = (id: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set('tab', id);
		router.replace(`/admin/configuration?${next.toString()}`);
	};

	return (
		<div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
			<header className="space-y-1">
				<h1 className="text-2xl font-semibold text-gray-900">
					{t('admin.configuration.page.title')}
				</h1>
				<p className="text-sm text-gray-500">{t('admin.configuration.page.subtitle')}</p>
			</header>

			<Tabs tabs={topTabs} activeTab={activeTab} onChange={setTab} />

			{activeTab === 'periods' && <PeriodsTab />}
			{activeTab === 'program-commissions' && <ProgramCommissionsTab />}
			{activeTab === 'chart-heads' && <ChartHeadsConfigPage />}
		</div>
	);
}
