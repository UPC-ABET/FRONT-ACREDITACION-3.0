'use client';

import { useCallback, useState } from 'react';
import { ArrowPathIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { Badge, Button, Card, Spinner } from '@/shared/components';
import { useI18n } from '@/providers';
import { useBannerSessionStatus } from '../hooks';
import type { BannerSessionStatusValue } from '../types';
import { BannerLoginDialog } from './BannerLoginDialog';

const STATUS_COLORS: Record<BannerSessionStatusValue, string> = {
	active: '#059669',
	expiring: '#d97706',
	expired: '#dc2626',
};

export function SessionStatusCard() {
	const { t, locale } = useI18n();
	const { data, isLoading, isError, isFetching, refetch } = useBannerSessionStatus();
	const [loginOpen, setLoginOpen] = useState(false);

	const handleLoginCompleted = useCallback(() => {
		refetch();
		setLoginOpen(false);
	}, [refetch]);

	const renderBody = () => {
		if (isLoading) {
			return (
				<div className="flex items-center gap-2 text-zinc-500">
					<Spinner size="sm" />
					<span>{t('banner.session.loading')}</span>
				</div>
			);
		}

		if (isError || !data) {
			return <p className="italic text-red-600">{t('banner.session.loadError')}</p>;
		}

		const status = data.status;
		const formattedExp = data.tokenExp
			? new Date(data.tokenExp).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')
			: null;

		return (
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<Badge color={STATUS_COLORS[status]}>{t(`banner.session.status.${status}`)}</Badge>
					{formattedExp && (
						<span className="text-sm text-zinc-500">
							{t('banner.session.tokenExp')}: {formattedExp}
						</span>
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
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1">{renderBody()}</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							variant="surface"
							size="sm"
							onClick={() => refetch()}
							loading={isFetching}
							disabled={isLoading}>
							<ArrowPathIcon className="h-4 w-4" />
							{t('banner.session.refresh')}
						</Button>
						<Button variant="primary" size="sm" onClick={() => setLoginOpen(true)}>
							<ArrowRightOnRectangleIcon className="h-4 w-4" />
							{t('banner.login.button')}
						</Button>
					</div>
				</div>
			</Card>

			{loginOpen && (
				<BannerLoginDialog onClose={() => setLoginOpen(false)} onCompleted={handleLoginCompleted} />
			)}
		</>
	);
}
