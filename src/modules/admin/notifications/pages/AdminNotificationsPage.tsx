'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { NotificationConfigPage } from '../components/NotificationConfigPage';

const DEFAULT_TAB = 'ifc';

export default function AdminNotificationsPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useI18n();

	const activeTab = searchParams.get('tab') ?? DEFAULT_TAB;

	const topTabs = [{ id: 'ifc', label: t('admin.notifications.tabs.ifc') }];

	const setTab = (id: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set('tab', id);
		router.replace(`/admin/notifications?${next.toString()}`);
	};

	return (
		<div className="space-y-6">
			<Tabs tabs={topTabs} activeTab={activeTab} onChange={setTab} />
			{activeTab === 'ifc' && <NotificationConfigPage />}
		</div>
	);
}
