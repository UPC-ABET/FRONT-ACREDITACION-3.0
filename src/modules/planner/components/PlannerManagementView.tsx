'use client';

import { useMemo, useState } from 'react';
import { Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useABET, useI18n } from '@/providers';
import { PlannerSessionStatusCard } from './PlannerSessionStatusCard';
import { PlannerStartScrapePanel } from './PlannerStartScrapePanel';
import { PlannerScrapeRunProgress } from './PlannerScrapeRunProgress';
import { PlannerScrapeRunHistory } from './PlannerScrapeRunHistory';
import { isTerminalPlannerScrapeStatus, usePlannerScrapeRuns } from '../hooks';

export function PlannerManagementView() {
	const { t, locale } = useI18n();
	const { academicPeriodId } = useABET();
	const { toast, showToast, handleError, clearToast } = useApiErrorToast();
	const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

	const runsQuery = usePlannerScrapeRuns(academicPeriodId);
	const runs = useMemo(() => runsQuery.data ?? [], [runsQuery.data]);

	const inProgressRun = useMemo(
		() => runs.find((run) => !isTerminalPlannerScrapeStatus(run.status)) ?? null,
		[runs],
	);

	const displayedRunId = selectedRunId ?? inProgressRun?.runId ?? null;

	const handleStarted = (runId: string) => {
		setSelectedRunId(runId);
		showToast(t('planner.scrape.started'), 'success');
	};

	const historyEmptyMessage = academicPeriodId
		? t('planner.history.empty')
		: t('planner.history.selectPeriod');

	return (
		<div className="w-full space-y-6">
			<PlannerSessionStatusCard />

			<PlannerStartScrapePanel
				canStart={Boolean(academicPeriodId)}
				isRunning={Boolean(inProgressRun)}
				onStarted={handleStarted}
				onError={handleError}
			/>

			{displayedRunId && <PlannerScrapeRunProgress runId={displayedRunId} />}

			<PlannerScrapeRunHistory
				data={runs}
				isLoading={runsQuery.isLoading}
				errorMessage={runsQuery.isError ? t('planner.history.error') : undefined}
				emptyMessage={historyEmptyMessage}
				locale={locale}
				onSelect={setSelectedRunId}
			/>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
