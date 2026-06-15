'use client';

import { useState } from 'react';
import { PageHeader, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import { SessionStatusCard } from './SessionStatusCard';
import { ScrapeRunForm } from './ScrapeRunForm';
import { ScrapeRunProgress } from './ScrapeRunProgress';

export function BannerManagementView() {
	const { t } = useI18n();
	const { toast, showToast, handleError, clearToast } = useApiErrorToast();
	const [activeRunId, setActiveRunId] = useState<string | null>(null);

	const handleStarted = (runId: string) => {
		setActiveRunId(runId);
		showToast(t('banner.scrape.started'), 'success');
	};

	return (
		<div className="w-full space-y-6">
			<PageHeader title={t('banner.title')} description={t('banner.subtitle')} />

			<SessionStatusCard />

			<ScrapeRunForm onStarted={handleStarted} onError={handleError} />

			{activeRunId && <ScrapeRunProgress runId={activeRunId} />}

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
