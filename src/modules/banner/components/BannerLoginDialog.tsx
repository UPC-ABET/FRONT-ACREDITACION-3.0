'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Spinner,
} from '@/shared/components';
import { getErrorMessage } from '@/shared/lib/apiError';
import { tryTranslate } from '@/shared/utils/tryTranslate';
import { useI18n } from '@/providers';
import {
	bannerQueryKeys,
	useBannerAuthSession,
	useCancelBannerAuthSession,
	useStartBannerAuthSession,
} from '../hooks';
import { buildBannerStreamUrl } from '../services';
import type { StartAuthSessionResponse } from '../types';

const NoVncViewer = dynamic(() => import('./NoVncViewer').then((m) => m.NoVncViewer), {
	ssr: false,
});

interface BannerLoginDialogProps {
	onClose: () => void;
	onCompleted: () => void;
}

export function BannerLoginDialog({ onClose, onCompleted }: BannerLoginDialogProps) {
	const { t } = useI18n();
	const queryClient = useQueryClient();
	const startSession = useStartBannerAuthSession();
	const cancelSession = useCancelBannerAuthSession();

	const [session, setSession] = useState<StartAuthSessionResponse | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const startedRef = useRef(false);
	const completedRef = useRef(false);

	const { data: sessionState } = useBannerAuthSession(session?.sessionId ?? null);
	const status = sessionState?.status;

	const runLogin = useCallback(() => {
		setErrorMessage(null);
		setSession(null);
		completedRef.current = false;
		startSession.mutate(undefined, {
			onSuccess: (data) => setSession(data),
			onError: (error) =>
				setErrorMessage(tryTranslate(t, getErrorMessage(error, 'banner.login.startFailed'))),
		});
	}, [startSession, t]);

	useEffect(() => {
		if (startedRef.current) return;
		startedRef.current = true;
		runLogin();
	}, [runLogin]);

	useEffect(() => {
		if (status === 'completed' && !completedRef.current) {
			completedRef.current = true;
			queryClient.invalidateQueries({ queryKey: bannerQueryKeys.sessionStatus() });
			onCompleted();
		}
	}, [status, queryClient, onCompleted]);

	const handleClose = () => {
		if (session && status !== 'completed') {
			cancelSession.mutate(session.sessionId);
		}
		onClose();
	};

	const streamUrl = session ? buildBannerStreamUrl(session.wsUrl) : null;
	const isStarting = startSession.isPending && !session;
	const isFailed = status === 'failed' || status === 'expired';

	const renderBody = () => {
		if (errorMessage) {
			return (
				<div className="flex flex-col items-center gap-3 py-10 text-center">
					<ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
					<p className="text-sm text-red-600">{errorMessage}</p>
				</div>
			);
		}

		if (status === 'completed') {
			return (
				<div className="flex flex-col items-center gap-3 py-10 text-center">
					<CheckCircleIcon className="h-10 w-10 text-emerald-500" />
					<p className="text-sm text-zinc-700">{t('banner.login.completed')}</p>
				</div>
			);
		}

		if (isFailed) {
			return (
				<div className="flex flex-col items-center gap-3 py-10 text-center">
					<ExclamationTriangleIcon className="h-10 w-10 text-amber-500" />
					<p className="text-sm text-zinc-700">{t(`banner.login.status.${status}`)}</p>
				</div>
			);
		}

		if (isStarting || !streamUrl) {
			return (
				<div className="flex flex-col items-center gap-3 py-16 text-center text-zinc-500">
					<Spinner size="lg" />
					<span className="text-sm">{t('banner.login.starting')}</span>
				</div>
			);
		}

		return <NoVncViewer url={streamUrl} />;
	};

	const showRetry = Boolean(errorMessage) || isFailed;

	return (
		<Dialog
			open
			onOpenChange={(next) => {
				if (!next) handleClose();
			}}>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>{t('banner.login.title')}</DialogTitle>
					<DialogDescription>{t('banner.login.subtitle')}</DialogDescription>
				</DialogHeader>

				{renderBody()}

				<DialogFooter>
					<Button variant="secondary" onClick={handleClose}>
						{status === 'completed' ? t('banner.login.done') : t('banner.login.cancel')}
					</Button>
					{showRetry && (
						<Button variant="primary" onClick={runLogin} loading={startSession.isPending}>
							{t('banner.login.retry')}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
