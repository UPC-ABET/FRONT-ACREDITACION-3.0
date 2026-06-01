'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs } from '@/shared/components';
import { useI18n } from '@/providers';
import { IfcCodesPage } from '../components/IfcCodesPage';
import { IfcFieldsPage } from '../components/IfcFieldsPage';
import { PerformanceLevelsPage } from '@/modules/evaluation/pages';

const DEFAULT_TAB = 'ifc';
const DEFAULT_IFC_SUB = 'codes';

export default function AdminParametersPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useI18n();

	const activeTab = searchParams.get('tab') ?? DEFAULT_TAB;
	const activeSub = searchParams.get('sub') ?? DEFAULT_IFC_SUB;

	const topTabs = [
		{ id: 'ifc', label: t('admin.parameters.tabs.ifc') },
		{ id: 'performance-levels', label: t('admin.parameters.tabs.performanceLevels') },
	];

	const ifcSubTabs = [
		{ id: 'codes', label: t('admin.parameters.ifc.tabs.codes') },
		{ id: 'fields', label: t('admin.parameters.ifc.tabs.fields') },
	];

	const setTab = (id: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set('tab', id);
		next.delete('sub');
		router.replace(`/admin/parameters?${next.toString()}`);
	};

	const setSub = (id: string) => {
		const next = new URLSearchParams(searchParams.toString());
		next.set('sub', id);
		router.replace(`/admin/parameters?${next.toString()}`);
	};

	return (
		<div className="space-y-6">
			<Tabs tabs={topTabs} activeTab={activeTab} onChange={setTab} />

			{activeTab === 'ifc' && (
				<div className="space-y-6">
					<Tabs tabs={ifcSubTabs} activeTab={activeSub} onChange={setSub} />
					{activeSub === 'codes' && <IfcCodesPage />}
					{activeSub === 'fields' && <IfcFieldsPage />}
				</div>
			)}

			{activeTab === 'performance-levels' && <PerformanceLevelsPage />}
		</div>
	);
}
