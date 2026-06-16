'use client';

import { PlayIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '@/shared/components';
import { useI18n } from '@/providers';
import { useStartPlannerScrape } from '../hooks';

interface PlannerStartScrapePanelProps {
	canStart: boolean;
	isRunning: boolean;
	onStarted: (runId: string) => void;
	onError: (error: unknown, fallbackKey?: string) => void;
}

export function PlannerStartScrapePanel({
	canStart,
	isRunning,
	onStarted,
	onError,
}: PlannerStartScrapePanelProps) {
	const { t } = useI18n();
	const startScrape = useStartPlannerScrape();

	const handleStart = () => {
		startScrape.mutate(undefined, {
			onSuccess: (response) => onStarted(response.runId),
			onError: (error) => onError(error, 'planner.scrape.startFailed'),
		});
	};

	const hint = !canStart
		? t('planner.scrape.selectPeriod')
		: isRunning
			? t('planner.scrape.alreadyRunning')
			: t('planner.scrape.ready');

	return (
		<Card
			title={t('planner.scrape.title')}
			description={t('planner.scrape.subtitle')}
			className="overflow-visible">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-zinc-600">{hint}</p>
				<Button
					onClick={handleStart}
					loading={startScrape.isPending}
					disabled={!canStart || isRunning}>
					<PlayIcon className="h-4 w-4" />
					{t('planner.scrape.start')}
				</Button>
			</div>
		</Card>
	);
}
