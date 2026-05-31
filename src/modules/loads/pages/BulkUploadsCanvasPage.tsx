'use client';

import { useState } from 'react';
import { useI18n } from '@/providers';
import { FlowRadialSelector, StageStepper, UploadCanvas } from '../components';
import type { FlowDescriptor, StageCode } from '../types';

interface BulkUploadsCanvasPageProps {
	onSubmit: (flow: FlowDescriptor, file: File) => Promise<void>;
	onBannerScrap?: (
		flow: FlowDescriptor,
		credentials: { username: string; password: string },
	) => Promise<void>;
	initialStage?: StageCode;
}

export default function BulkUploadsCanvasPage({
	onSubmit,
	onBannerScrap,
	initialStage = 'PRE_ENROLL',
}: BulkUploadsCanvasPageProps) {
	const { t } = useI18n();
	const [stage, setStage] = useState<StageCode>(initialStage);
	const [flow, setFlow] = useState<FlowDescriptor | null>(null);

	const handleStageChange = (next: StageCode) => {
		setStage(next);
		setFlow(null);
	};

	return (
		<div className="space-y-6">
			<header>
				<h1 className="text-2xl font-semibold text-gray-900">{t('uploads.canvas.title')}</h1>
				<p className="mt-1 text-sm text-gray-500">{t('uploads.canvas.subtitle')}</p>
			</header>

			<StageStepper current={stage} onChange={handleStageChange} />
			<FlowRadialSelector stage={stage} selectedFlowCode={flow?.code ?? null} onChange={setFlow} />
			<UploadCanvas flow={flow} onSubmit={onSubmit} onBannerScrap={onBannerScrap} />
		</div>
	);
}
