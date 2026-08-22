'use client';

import { Badge, Card, Spinner } from '@/shared/components';
import { useI18n } from '@/providers';
import { usePlannerScrapeRun, isTerminalPlannerScrapeStatus } from '../hooks';
import { PLANNER_SCRAPE_STATUS_COLORS } from '../constants';
import { PlannerScrapePhaseLabel } from './PlannerScrapePhaseLabel';
import type { PlannerScrapeRunStats } from '../types';

interface PlannerScrapeRunProgressProps {
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

function StatsDetail({ stats }: { stats: PlannerScrapeRunStats }) {
	const { t } = useI18n();

	return (
		<div className="space-y-5">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<CountTile label={t('planner.run.counts.seccion')} value={stats.counts.sections ?? 0} />
				<CountTile
					label={t('planner.run.counts.evaluacion')}
					value={stats.counts.evaluations ?? 0}
				/>
				<CountTile label={t('planner.run.counts.nota')} value={stats.counts.grades ?? 0} />
				<CountTile label={t('planner.run.counts.uniqueSections')} value={stats.uniqueSections} />
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div>
					<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
						{t('planner.run.courses.requested')}
					</p>
					<p className="text-sm text-zinc-700">{stats.courses.requested.length}</p>
				</div>
				<div>
					<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-600">
						{t('planner.run.courses.succeeded')}
					</p>
					<p className="text-sm text-zinc-700">{stats.courses.succeeded.length}</p>
				</div>
				<div>
					<p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-600">
						{t('planner.run.courses.failed')}
					</p>
					<p className="text-sm text-zinc-700">{stats.courses.failed.join(', ') || '—'}</p>
				</div>
			</div>

			{stats.fatal && (
				<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					<span className="font-semibold">{t('planner.run.fatal')}: </span>
					{stats.fatal}
				</div>
			)}

			{stats.errors.length > 0 && (
				<div>
					<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
						{t('planner.run.errors')}
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

export function PlannerScrapeRunProgress({ runId }: PlannerScrapeRunProgressProps) {
	const { t } = useI18n();
	const { data, isLoading, isError } = usePlannerScrapeRun(runId);

	const isRunning = !isTerminalPlannerScrapeStatus(data?.status);

	return (
		<Card
			title={t('planner.run.title')}
			description={`${t('planner.run.runId')}: ${runId}`}
			className="overflow-visible">
			{isLoading ? (
				<div className="flex items-center gap-2 text-zinc-500">
					<Spinner size="sm" />
					<span>{t('planner.run.loading')}</span>
				</div>
			) : isError || !data ? (
				<p className="italic text-red-600">{t('planner.run.loadError')}</p>
			) : (
				<div className="space-y-5">
					<div className="flex items-center gap-3">
						<Badge color={PLANNER_SCRAPE_STATUS_COLORS[data.status]}>
							{t(`planner.run.status.${data.status}`)}
						</Badge>
						<PlannerScrapePhaseLabel phase={data.phase} />
						{isRunning && (
							<span className="flex items-center gap-2 text-sm text-zinc-500">
								<Spinner size="sm" />
								{t('planner.run.polling')}
							</span>
						)}
					</div>

					{data.stats ? (
						<StatsDetail stats={data.stats} />
					) : (
						<p className="text-sm text-zinc-500">{t('planner.run.noStatsYet')}</p>
					)}
				</div>
			)}
		</Card>
	);
}
