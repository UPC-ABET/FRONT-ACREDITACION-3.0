'use client';

import { useMemo, useState } from 'react';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import type { TypeOption } from '@/modules/core';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { Card, PageHeader, Tabs } from '@/shared/components';
import { useABET, useI18n } from '@/providers';
import {
	hasUploadMaintenance,
	UploadMaintenance,
	UploadPanel,
	UploadTypeSelect,
} from '../components';

type LoadsTab = 'upload' | 'maintenance';

export default function LoadsPage() {
	const { t } = useI18n();
	const { academicPeriodId } = useABET();
	const [typeCode, setTypeCode] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<LoadsTab>('upload');

	const { data: uploadTypes } = useTypesByGroupCode(TYPE_GROUP_CODES.UPLOAD_TYPE);

	const selectedType: TypeOption | null = useMemo(() => {
		if (!typeCode) return null;
		return uploadTypes?.find((type) => type.code === typeCode) ?? null;
	}, [typeCode, uploadTypes]);

	const maintenanceAvailable = selectedType ? hasUploadMaintenance(selectedType.code) : false;

	// Fall back to the upload tab when the selected type has no maintenance view.
	const effectiveTab: LoadsTab = maintenanceAvailable ? activeTab : 'upload';

	const tabs = useMemo(() => {
		const list = [{ id: 'upload', label: t('loads.tabs.upload') }];
		if (maintenanceAvailable) {
			list.push({ id: 'maintenance', label: t('loads.tabs.maintenance') });
		}
		return list;
	}, [maintenanceAvailable, t]);

	const canUpload = selectedType && academicPeriodId !== null;

	return (
		<div className="w-full space-y-6">
			<PageHeader title={t('loads.page.title')} description={t('loads.page.subtitle')} />

			<Card>
				<div className="grid gap-4 sm:max-w-sm">
					<UploadTypeSelect value={typeCode} onChange={setTypeCode} />
				</div>
			</Card>

			{!selectedType ? (
				<p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
					{t('loads.upload.selectBoth')}
				</p>
			) : (
				<div className="space-y-6">
					<Tabs
						tabs={tabs}
						activeTab={effectiveTab}
						onChange={(id) => setActiveTab(id as LoadsTab)}
						ariaLabel={t('loads.tabs.label')}
					/>

					{effectiveTab === 'maintenance' ? (
						<UploadMaintenance typeCode={selectedType.code} />
					) : (
						<div className="w-full">
							{canUpload ? (
								<UploadPanel
									key={selectedType.code}
									type={selectedType}
									academicPeriodId={academicPeriodId}
								/>
							) : (
								<p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
									{t('loads.upload.selectBoth')}
								</p>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
