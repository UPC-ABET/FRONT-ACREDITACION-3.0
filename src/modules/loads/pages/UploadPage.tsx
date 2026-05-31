'use client';

import { useState } from 'react';
import { AcademicPeriodSelect } from '@/modules/academic/components';
import { useI18n } from '@/providers';
import { UploadForm } from '../components';
import { findFlowByCode } from '../constants';

interface UploadPageProps {
	// Matches FlowDescriptor.code in the flow registry (e.g. 'sections', 'enrolled-students').
	flowCode: string;
}

export default function UploadPage({ flowCode }: UploadPageProps) {
	const { t } = useI18n();
	const [academicPeriodId, setAcademicPeriodId] = useState<number | null>(null);
	const flow = findFlowByCode(flowCode);

	if (!flow) {
		return (
			<div className="mx-auto max-w-3xl p-6">
				<p className="text-sm text-red-600">Unknown upload flow: {flowCode}</p>
			</div>
		);
	}

	const k = (suffix: string) => `${flow.formI18nKey}.${suffix}`;

	return (
		<div className="mx-auto max-w-3xl space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-lg font-semibold text-gray-900">{t(k('pageTitle'))}</h1>
				<p className="text-sm text-gray-500">{t(k('pageSubtitle'))}</p>
			</div>

			<AcademicPeriodSelect value={academicPeriodId} onChange={setAcademicPeriodId} />

			{academicPeriodId !== null && <UploadForm flow={flow} academicPeriodId={academicPeriodId} />}
		</div>
	);
}
