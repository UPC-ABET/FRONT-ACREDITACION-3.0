'use client';

import { useMemo, useState } from 'react';
import { PageHeader, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useABET, useI18n } from '@/providers';
import { SessionStatusCard } from './SessionStatusCard';
import { StartScrapePanel } from './StartScrapePanel';
import { ScrapeRunProgress } from './ScrapeRunProgress';
import { ScrapeRunHistory } from './ScrapeRunHistory';
import { isTerminalScrapeStatus, useBannerScrapeRuns } from '../hooks';

export function BannerManagementView() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const { toast, showToast, handleError, clearToast } = useApiErrorToast();
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

	const runsQuery = useBannerScrapeRuns(academicPeriodId);
	const runs = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);

	const inProgressRun = useMemo(
		() => runs.find((run) => !isTerminalScrapeStatus(run.status)) ?? null,
		[runs],
	);

	const displayedRunId = selectedRunId ?? inProgressRun?.runId ?? null;

	const handleStarted = (runId: string) => {
		setSelectedRunId(runId);
		showToast(t('banner.scrape.started'), 'success');
	};

	const historyEmptyMessage = academicPeriodId
		? t('banner.history.empty')
		: t('banner.history.selectPeriod');

	return (
		<div className="w-full space-y-6">
			<PageHeader title={t('banner.title')} description={t('banner.subtitle')} />

			<SessionStatusCard />

			<StartScrapePanel
				canStart={Boolean(academicPeriodId)}
				isRunning={Boolean(inProgressRun)}
				onStarted={handleStarted}
				onError={handleError}
			/>

			{displayedRunId && <ScrapeRunProgress runId={displayedRunId} />}

			<ScrapeRunHistory
				data={runs}
				isLoading={runsQuery.isLoading}
				errorMessage={runsQuery.isError ? t('banner.history.error') : undefined}
				emptyMessage={historyEmptyMessage}
				locale={locale}
				onSelect={setSelectedRunId}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
