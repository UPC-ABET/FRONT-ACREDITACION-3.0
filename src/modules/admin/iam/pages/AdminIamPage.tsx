'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { UsersTab } from '../components/users';
import { RolesTab } from '../components/roles';
import { ModulesTab } from '../components/modules';
import { PermissionsTab } from '../components/permissions';

const DEFAULT_TAB = 'users';

export default function AdminIamPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useI18n();

	const activeTab = searchParams.get('tab') ?? DEFAULT_TAB;

	const topTabs = [
		{ id: 'users', label: t('admin.iam.tabs.users') },
		{ id: 'roles', label: t('admin.iam.tabs.roles') },
		{ id: 'modules', label: t('admin.iam.tabs.modules') },
		{ id: 'permissions', label: t('admin.iam.tabs.permissions') },
	];

	const setTab = (id: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set('tab', id);
		next.delete('new');
		next.delete('edit');
		router.replace(`/admin/iam?${next.toString()}`);
	};

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight text-zinc-900">
					{t('admin.iam.page.title')}
				</h1>
				<p className="text-sm text-zinc-500">{t('admin.iam.page.subtitle')}</p>
			</div>

			<Tabs tabs={topTabs} activeTab={activeTab} onChange={setTab} />

			{activeTab === 'users' && <UsersTab />}
			{activeTab === 'roles' && <RolesTab />}
			{activeTab === 'modules' && <ModulesTab />}
			{activeTab === 'permissions' && <PermissionsTab />}
		</div>
	);
}
