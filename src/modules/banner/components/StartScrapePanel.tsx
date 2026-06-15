'use client';

import { PlayIcon } from '@heroicons/react/24/outline';
import { Button, Card } from '@/shared/components';
import { useI18n } from '@/providers';
import { useStartBannerScrape } from '../hooks';

interface StartScrapePanelProps {
	canStart: boolean;
	isRunning: boolean;
	onStarted: (runId: string) => void;
	onError: (error: unknown, fallbackKey?: string) => void;
}

export function StartScrapePanel({
	canStart,
	isRunning,
	onStarted,
	onError,
}: StartScrapePanelProps) {
	const { t } = useI18n();
	const startScrape = useStartBannerScrape();

	const handleStart = () => {
		startScrape.mutate(undefined, {
			onSuccess: (response) => onStarted(response.runId),
			onError: (error) => onError(error, 'banner.scrape.startFailed'),
		});
	};

	const hint = !canStart
		? t('banner.scrape.selectPeriod')
		: isRunning
			? t('banner.scrape.alreadyRunning')
			: t('banner.scrape.ready');

	return (
		<Card
			title={t('banner.scrape.title')}
			description={t('banner.scrape.subtitle')}
			className="overflow-visible">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p className="text-sm text-zinc-600">{hint}</p>
				<Button
					onClick={handleStart}
					loading={startScrape.isPending}
					disabled={!canStart || isRunning}>
					<PlayIcon className="h-4 w-4" />
					{t('banner.scrape.start')}
				</Button>
			</div>
		</Card>
	);
}
