'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowPathIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, Spinner, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { ApiError } from '@/shared/lib/apiError';
import {
	plannerQueryKeys,
	usePlannerCredentials,
	usePlannerSessionStatus,
	useRefreshPlannerSession,
} from '../hooks';
import {
	PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY,
	PLANNER_SESSION_STATUS_COLORS,
} from '../constants';
import { PlannerCredentialsDialog } from './PlannerCredentialsDialog';

// Unlike Banner, Planner has no manual "stopper": the token is obtained/refreshed
// server-side from stored credentials, so there is no login button — only a refresh.
// There is also no refresh action while not_configured: nothing exists yet to refresh,
// and pressing it would only produce credentialsNotConfigured.
export function PlannerSessionStatusCard() {
	const { t, locale } = useI18n();
	const queryClient = useQueryClient();
	const { data, isLoading, isError } = usePlannerSessionStatus();
	const { data: credentials } = usePlannerCredentials();
	const refreshSession = useRefreshPlannerSession();
	const { toast, showToast, handleError, clearToast } = useApiErrorToast();

	const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);

	const status = data?.status;
	const formattedExp = data?.tokenExp
		? new Date(data.tokenExp).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')
		: null;
	const formattedUpdatedAt = credentials?.updatedAt
		? new Date(credentials.updatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')
		: null;

	const handleRefresh = () => {
		refreshSession.mutate(undefined, {
			onError: (error) => {
				if (error instanceof ApiError && error.message === PLANNER_CREDENTIALS_NOT_CONFIGURED_KEY) {
					// Defensive fallback only (the refresh button is hidden while not_configured):
					// a race where credentials were cleared elsewhere between load and click.
					// Refetch instead of showing an error — the not_configured rendering takes over.
					queryClient.invalidateQueries({ queryKey: plannerQueryKeys.sessionStatus() });
					return;
				}
				handleError(error, 'planner.session.refreshError');
			},
		});
	};

	const handleCredentialsSaved = () => {
		setCredentialsDialogOpen(false);
		showToast(t('planner.credentials.saveSuccess'), 'success');
	};

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
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-zinc-700">
						{t('planner.session.tokenLabel')}:
					</span>
					<Badge color={PLANNER_SESSION_STATUS_COLORS[status]}>
						{t(`planner.session.status.${status}`)}
					</Badge>
					{formattedExp ? (
						<span className="text-sm text-zinc-500">
							{t('planner.session.tokenExp')} {formattedExp}
						</span>
					) : (
						<span className="text-sm italic text-zinc-500">{t('planner.session.noToken')}</span>
					)}
				</div>

				<p className="text-sm text-zinc-600">{t(`planner.session.hint.${status}`)}</p>

				{status !== 'not_configured' && credentials?.configured && (
					<p className="text-sm text-zinc-500">
						<span className="font-semibold text-zinc-700">
							{t('planner.credentials.currentLabel')}
						</span>{' '}
						{credentials.username}
						{formattedUpdatedAt && (
							<>
								{' '}
								· {t('planner.credentials.updatedAtLabel')} {formattedUpdatedAt}
							</>
						)}
					</p>
				)}
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
					{status !== 'not_configured' && (
						<Button
							variant="surface"
							size="sm"
							onClick={handleRefresh}
							loading={refreshSession.isPending}
							disabled={isLoading}>
							<ArrowPathIcon className="h-4 w-4" />
							{t('planner.session.refresh')}
						</Button>
					)}
					<Button variant="primary" size="sm" onClick={() => setCredentialsDialogOpen(true)}>
						<ArrowRightOnRectangleIcon className="h-4 w-4" />
						{t('planner.credentials.openButton')}
					</Button>
				</div>
			</div>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />

			{credentialsDialogOpen && (
				<PlannerCredentialsDialog
					initialUsername={credentials?.username ?? null}
					onClose={() => setCredentialsDialogOpen(false)}
					onSaved={handleCredentialsSaved}
				/>
			)}
		</Card>
	);
}
