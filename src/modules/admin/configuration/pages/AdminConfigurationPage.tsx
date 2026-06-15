'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, PageHeader, Tabs } from '@/shared/components';
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
		<div className="w-full space-y-6">
			<PageHeader
				title={t('admin.configuration.page.title')}
				description={t('admin.configuration.page.subtitle')}
			/>

			<Tabs tabs={topTabs} activeTab={activeTab} onChange={setTab} />

			{activeTab === 'chart-heads' ? (
				<ChartHeadsConfigPage />
			) : (
				<Card className="overflow-visible">
					{activeTab === 'periods' && <PeriodsTab />}
					{activeTab === 'program-commissions' && <ProgramCommissionsTab />}
				</Card>
			)}
		</div>
	);
}
