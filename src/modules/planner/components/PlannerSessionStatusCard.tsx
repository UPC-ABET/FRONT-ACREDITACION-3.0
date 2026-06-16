'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, Spinner } from '@/shared/components';
import { useI18n } from '@/providers';
import { usePlannerSessionStatus, useRefreshPlannerSession } from '../hooks';
import type { PlannerSessionStatusValue } from '../types';

const TOKEN_COLORS: Record<PlannerSessionStatusValue, string> = {
	active: '#059669',
	expiring: '#d97706',
	expired: '#dc2626',
};

// Unlike Banner, Planner has no manual "stopper": the token is obtained/refreshed
// server-side from stored credentials, so there is no login button — only a refresh.
export function PlannerSessionStatusCard() {
	const { t, locale } = useI18n();
	const { data, isLoading, isError } = usePlannerSessionStatus();
	const refreshSession = useRefreshPlannerSession();

	const status = data?.status;
	const formattedExp = data?.tokenExp
		? new Date(data.tokenExp).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')
		: null;

	const renderBody = () => {
		if (isLoading) {
			return (
				<div className="flex items-center gap-2 text-zinc-500">
					<Spinner size="sm" />
					<span>{t('planner.session.loading')}</span>
				</div>
			);
		}

		if (isError || !data || status === undefined) {
			return <p className="italic text-red-600">{t('planner.session.loadError')}</p>;
		}

		return (
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-zinc-700">
						{t('planner.session.tokenLabel')}:
					</span>
					<Badge color={TOKEN_COLORS[status]}>{t(`planner.session.status.${status}`)}</Badge>
					{formattedExp ? (
						<span className="text-sm text-zinc-500">
							{t('planner.session.tokenExp')} {formattedExp}
						</span>
					) : (
						<span className="text-sm italic text-zinc-500">{t('planner.session.noToken')}</span>
					)}
				</div>

				<p className="text-sm text-zinc-600">{t(`planner.session.hint.${status}`)}</p>
			</div>
		);
	};

	return (
		<Card
			title={t('planner.session.title')}
			description={t('planner.session.subtitle')}
			className="overflow-visible">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
				<div className="flex-1">{renderBody()}</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button
						variant="surface"
						size="sm"
						onClick={() => refreshSession.mutate()}
						loading={refreshSession.isPending}
						disabled={isLoading}>
						<ArrowPathIcon className="h-4 w-4" />
						{t('planner.session.refresh')}
					</Button>
				</div>
			</div>
		</Card>
	);
}
