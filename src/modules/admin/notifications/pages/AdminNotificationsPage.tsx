'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { NotificationConfigPage } from '../components/NotificationConfigPage';
import { SurveyMessagesTab } from '../components/SurveyMessagesTab';
import { UserTemplatesTab } from '../components/UserTemplatesTab';
import { NotificationLogsTab } from '../components/NotificationLogsTab';

const DEFAULT_TAB = 'ifc';

export default function AdminNotificationsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useI18n();

	const activeTab = searchParams.get('tab') ?? DEFAULT_TAB;

	const topTabs = [
		{ id: 'ifc', label: t('admin.notifications.tabs.ifc') },
		{ id: 'survey', label: t('admin.notifications.tabs.survey') },
		{ id: 'user', label: t('admin.notifications.tabs.user') },
		{ id: 'logs', label: t('admin.notifications.tabs.logs') },
	];

	const setTab = (id: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set('tab', id);
		router.replace(`/admin/notifications?${next.toString()}`);
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('admin.notifications.page.title')}
				description={t('admin.notifications.page.subtitle')}
			/>

			<Tabs tabs={topTabs} activeTab={activeTab} onChange={setTab} />
			<Card className="overflow-visible">
				{activeTab === 'ifc' && <NotificationConfigPage />}
				{activeTab === 'survey' && <SurveyMessagesTab />}
				{activeTab === 'user' && <UserTemplatesTab />}
				{activeTab === 'logs' && <NotificationLogsTab />}
			</Card>
		</div>
	);
}
