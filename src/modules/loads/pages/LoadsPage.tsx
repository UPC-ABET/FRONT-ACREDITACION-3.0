'use client';

import { useMemo, useState } from 'react';
import { AcademicPeriodSelect } from '@/modules/academic/components';
import { useTypesByGroupCode } from '@/modules/core/hooks';
import type { TypeOption } from '@/modules/core';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { useI18n } from '@/providers';
import { UploadPanel, UploadTypeSelect } from '../components';

export default function LoadsPage() {
	const { t } = useI18n();
	const [typeCode, setTypeCode] = useState<string | null>(null);
	const [academicPeriodId, setAcademicPeriodId] = useState<number | null>(null);

	const { data: uploadTypes } = useTypesByGroupCode(TYPE_GROUP_CODES.UPLOAD_TYPE);

	const selectedType: TypeOption | null = useMemo(() => {
		if (!typeCode) return null;
		return uploadTypes?.find((type) => type.code === typeCode) ?? null;
	}, [typeCode, uploadTypes]);

	return (
		<div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
			<header className="space-y-1">
				<h1 className="text-2xl font-semibold text-gray-900">{t('loads.page.title')}</h1>
				<p className="text-sm text-gray-500">{t('loads.page.subtitle')}</p>
			</header>

			<div className="grid gap-4 sm:grid-cols-2">
				<UploadTypeSelect value={typeCode} onChange={setTypeCode} />
				<AcademicPeriodSelect value={academicPeriodId} onChange={setAcademicPeriodId} />
			</div>

			{selectedType && academicPeriodId !== null ? (
				<UploadPanel type={selectedType} academicPeriodId={academicPeriodId} />
			) : (
				<p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
					{t('loads.upload.selectBoth')}
				</p>
			)}
		</div>
	);
}
