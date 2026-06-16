'use client';

import { useCallback, useState } from 'react';
import { ArrowPathIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, Spinner } from '@/shared/components';
import { useI18n } from '@/providers';
import { useBannerSessionStatus, useRefreshBannerSession } from '../hooks';
import type { BannerSessionStatusValue } from '../types';
import { BannerLoginDialog } from './BannerLoginDialog';

const TOKEN_COLORS: Record<BannerSessionStatusValue, string> = {
	active: '#059669',
	expiring: '#d97706',
	expired: '#dc2626',
};

export function SessionStatusCard() {
	const { t, locale } = useI18n();
	const { data, isLoading, isError } = useBannerSessionStatus();
	const refreshSession = useRefreshBannerSession();
	const [loginOpen, setLoginOpen] = useState(false);

	const handleLoginCompleted = useCallback(() => setLoginOpen(false), []);

	const status = data?.status;
	const formattedExp = data?.tokenExp
		? new Date(data.tokenExp).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')
		: null;

	const renderBody = () => {
		if (isLoading) {
			return (
				<div className="flex items-center gap-2 text-zinc-500">
					<Spinner size="sm" />
					<span>{t('banner.session.loading')}</span>
				</div>
			);
		}

		if (isError || !data || status === undefined) {
			return <p className="italic text-red-600">{t('banner.session.loadError')}</p>;
		}

		return (
			<div className="space-y-3">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-zinc-700">
						{t('banner.session.tokenLabel')}:
					</span>
					<Badge color={TOKEN_COLORS[status]}>{t(`banner.session.status.${status}`)}</Badge>
					{formattedExp ? (
						<span className="text-sm text-zinc-500">
							{t('banner.session.tokenExp')} {formattedExp}
						</span>
					) : (
						<span className="text-sm italic text-zinc-500">{t('banner.session.noToken')}</span>
					)}
				</div>

				<p className="text-sm text-zinc-600">{t(`banner.session.hint.${status}`)}</p>
			</div>
		);
	};

	return (
		<>
			<Card
				title={t('banner.session.title')}
				description={t('banner.session.subtitle')}
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
							{t('banner.session.refresh')}
						</Button>
						{status === 'expired' && (
							<Button variant="primary" size="sm" onClick={() => setLoginOpen(true)}>
								<ArrowRightOnRectangleIcon className="h-4 w-4" />
								{t('banner.login.button')}
							</Button>
						)}
					</div>
				</div>
			</Card>

			{loginOpen && (
				<BannerLoginDialog onClose={() => setLoginOpen(false)} onCompleted={handleLoginCompleted} />
			)}
		</>
	);
}
