'use client';

import { Card, PageHeader, Tabs, useTabParam } from '@/shared';
import { useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import { NotificationConfigPage } from '@/modules/admin/notifications';
import { SurveyMessagesTab } from '@/modules/admin/notifications';
import { UserTemplatesTab } from '@/modules/admin/notifications';
import { NotificationLogsTab } from '@/modules/admin/notifications';

const DEFAULT_TAB = 'ifc';

export default function AdminNotificationsPage() {
	const { t } = useI18n();
	const [activeTab, setTab] = useTabParam(DEFAULT_TAB);

	useGlobalAcademicFiltersVisibilityOverride(
		activeTab === 'survey' ? {} : { school: false, modality: false, period: false },
	);

	const topTabs = [
		{ id: 'ifc', label: t('admin.notifications.tabs.ifc') },
		{ id: 'survey', label: t('admin.notifications.tabs.survey') },
		{ id: 'user', label: t('admin.notifications.tabs.user') },
		{ id: 'logs', label: t('admin.notifications.tabs.logs') },
	];

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
