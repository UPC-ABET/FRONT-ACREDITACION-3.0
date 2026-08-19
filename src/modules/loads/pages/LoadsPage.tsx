'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import type { TypeOption } from '@/modules/core';
import { findDirectorForSchool, useChartHeadsConfig } from '@/modules/admin/chart-heads';
import { TYPE_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import { Card, PageHeader, Tabs, TableEmptyState } from '@/shared/components';
import { useTabParam } from '@/shared';
import { logger } from '@/shared/lib';
import { useABET, useGlobalAcademicFiltersVisibilityOverride, useI18n } from '@/providers';
import {
	hasUploadMaintenance,
	UploadMaintenance,
	UploadPanel,
	UploadTypeSelect,
} from '../components';

type LoadsTab = 'upload' | 'maintenance';

export default function LoadsPage() {
	const { t } = useI18n();
	const { academicPeriodId, schoolId } = useABET();
	const [typeCode, setTypeCode] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useTabParam('upload');

	const { data: uploadTypes } = useTypesByGroupCode(TYPE_GROUP_CODES.UPLOAD_TYPE);

	const selectedType: TypeOption | null = useMemo(() => {
		if (!typeCode) return null;
		return uploadTypes?.find((type) => type.code === typeCode) ?? null;
	}, [typeCode, uploadTypes]);

	const isChartsFlow = selectedType?.code === TYPE_CODES.UPLOAD_TYPE.CHARTS;

	useGlobalAcademicFiltersVisibilityOverride({
		school: isChartsFlow,
	});

	const chartHeadsConfig = useChartHeadsConfig(isChartsFlow ? academicPeriodId : null);

	useEffect(() => {
		if (chartHeadsConfig.isError) {
			logger.warn(
				'[LoadsPage] failed to load chart-heads config for the upload precondition check',
				chartHeadsConfig.error,
			);
		}
	}, [chartHeadsConfig.isError, chartHeadsConfig.error]);

	const chartsPrecondition = useMemo(() => {
		if (!isChartsFlow || schoolId === null || !chartHeadsConfig.data) return undefined;
		const director = findDirectorForSchool(chartHeadsConfig.data, schoolId);
		return {
			hasDirector: director !== undefined,
			hasPrograms: (director?.programs.length ?? 0) > 0,
		};
	}, [isChartsFlow, schoolId, chartHeadsConfig.data]);

	const maintenanceAvailable = selectedType ? hasUploadMaintenance(selectedType.code) : false;

	// Fall back to the upload tab when the selected type has no maintenance view.
	const effectiveTab: LoadsTab = maintenanceAvailable ? (activeTab as LoadsTab) : 'upload';

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
				<TableEmptyState message={t('loads.upload.selectBoth')} />
			) : (
				<div className="space-y-6">
					<Tabs
						tabs={tabs}
						activeTab={effectiveTab}
						onChange={setActiveTab}
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
									chartsPrecondition={chartsPrecondition}
								/>
							) : (
								<TableEmptyState message={t('loads.upload.selectBoth')} />
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
