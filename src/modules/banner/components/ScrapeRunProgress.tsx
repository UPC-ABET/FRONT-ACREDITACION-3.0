'use client';

import { Badge, Card, Spinner } from '@/shared/components';
import { useI18n } from '@/providers';
import { useBannerScrapeRun, isTerminalScrapeStatus } from '../hooks';
import { SCRAPE_STATUS_COLORS } from '../constants';
import type { ScrapeRunStats } from '../types';

interface ScrapeRunProgressProps {
	runId: string;
}

function CountTile({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
			<p className="text-2xl font-bold text-zinc-900">{value}</p>
			<p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
		</div>
	);
}

function StatsDetail({ stats }: { stats: ScrapeRunStats }) {
	const { t } = useI18n();

	return (
		<div className="space-y-5">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<CountTile label={t('banner.run.counts.horario')} value={stats.counts.horario} />
				<CountTile label={t('banner.run.counts.matricula')} value={stats.counts.matricula} />
				<CountTile label={t('banner.run.counts.alumno')} value={stats.counts.alumno} />
				<CountTile label={t('banner.run.counts.uniqueStudents')} value={stats.uniqueStudents} />
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div>
					<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
						{t('banner.run.departments.requested')}
					</p>
					<p className="text-sm text-zinc-700">{stats.departments.requested.join(', ') || '—'}</p>
				</div>
				<div>
					<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
						{t('banner.run.departments.succeeded')}
					</p>
					<p className="text-sm text-zinc-700">{stats.departments.succeeded.join(', ') || '—'}</p>
				</div>
				<div>
					<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-600">
						{t('banner.run.departments.failed')}
					</p>
					<p className="text-sm text-zinc-700">{stats.departments.failed.join(', ') || '—'}</p>
				</div>
			</div>

			{stats.fatal && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					<span className="font-semibold">{t('banner.run.fatal')}: </span>
					{stats.fatal}
				</div>
			)}

			{stats.errors.length > 0 && (
				<div>
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
						{t('banner.run.errors')}
					</p>
					<ul className="space-y-1.5">
						{stats.errors.map((error, index) => (
							<li
								key={`${error.step}-${error.key}-${index}`}
								className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
								<span className="font-semibold uppercase">{error.step}</span>
								<span className="text-amber-700"> · {error.key}</span>
								<span className="block text-amber-800">{error.message}</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}

export function ScrapeRunProgress({ runId }: ScrapeRunProgressProps) {
	const { t } = useI18n();
	const { data, isLoading, isError } = useBannerScrapeRun(runId);

	const isRunning = !isTerminalScrapeStatus(data?.status);

	return (
		<Card
			title={t('banner.run.title')}
			description={`${t('banner.run.runId')}: ${runId}`}
			className="overflow-visible">
			{isLoading ? (
				<div className="flex items-center gap-2 text-zinc-500">
					<Spinner size="sm" />
					<span>{t('banner.run.loading')}</span>
				</div>
			) : isError || !data ? (
				<p className="italic text-red-600">{t('banner.run.loadError')}</p>
			) : (
				<div className="space-y-5">
					<div className="flex items-center gap-3">
						<Badge color={SCRAPE_STATUS_COLORS[data.status]}>
							{t(`banner.run.status.${data.status}`)}
						</Badge>
						{isRunning && (
							<span className="flex items-center gap-2 text-sm text-zinc-500">
								<Spinner size="sm" />
								{t('banner.run.polling')}
							</span>
						)}
					</div>

					{data.stats ? (
						<StatsDetail stats={data.stats} />
					) : (
						<p className="text-sm text-zinc-500">{t('banner.run.noStatsYet')}</p>
					)}
				</div>
			)}
		</Card>
	);
}
