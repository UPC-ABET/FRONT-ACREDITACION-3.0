'use client';

import { PageHeader, Tabs, useTabParam } from '@/shared';
import { useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import { IfcCodesPage } from '../components/IfcCodesPage';
import { IfcFieldsPage } from '../components/IfcFieldsPage';
import { PerformanceLevelsPage } from '@/modules/evaluation/pages';

const DEFAULT_TAB = 'ifc';
const DEFAULT_IFC_SUB = 'codes';

export default function AdminParametersPage() {
	const { t } = useI18n();
	const [activeTab, setTab] = useTabParam(DEFAULT_TAB, { clearParams: ['sub'] });
	const [activeSub, setSub] = useTabParam(DEFAULT_IFC_SUB, { paramName: 'sub' });

	useGlobalAcademicFiltersVisibilityOverride(
		activeTab === 'ifc' ? { school: false, modality: false, period: false } : {},
	);

	const topTabs = [
		{ id: 'ifc', label: t('admin.parameters.tabs.ifc') },
		{ id: 'performance-levels', label: t('admin.parameters.tabs.performanceLevels') },
	];

	const ifcSubTabs = [
		{ id: 'codes', label: t('admin.parameters.ifc.tabs.codes') },
		{ id: 'fields', label: t('admin.parameters.ifc.tabs.fields') },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title={t('admin.parameters.page.title')}
				description={t('admin.parameters.page.subtitle')}
			/>

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
