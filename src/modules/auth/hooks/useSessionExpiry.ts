'use client';

import { useEffect, useRef } from 'react';
import { apiGet } from '@/shared/lib';

type UseSessionExpiryParams = {
	enabled: boolean;
	onExpire: () => void;
	idleMs?: number;
	syncPollMs?: number;
};

const DEFAULT_IDLE_MS = 60 * 60 * 1000;
const DEFAULT_SYNC_POLL_MS = 60_000;

export function useSessionExpiry({
	enabled,
	onExpire,
	idleMs = DEFAULT_IDLE_MS,
	syncPollMs = DEFAULT_SYNC_POLL_MS,
}: UseSessionExpiryParams) {
	const expiredRef = useRef(false);

	useEffect(() => {
		if (!enabled) return;

		const runExpire = () => {
			if (expiredRef.current) return;
			expiredRef.current = true;
			onExpire();
		};

		const checkSession = async () => {
			try {
				await apiGet('/users/me');
			} catch {
				runExpire();
			}
		};

		let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

		const resetInactivityTimer = () => {
			if (inactivityTimer) clearTimeout(inactivityTimer);
			inactivityTimer = setTimeout(runExpire, idleMs);
		};

		const events: Array<keyof WindowEventMap> = [
			'mousemove',
			'keydown',
			'click',
			'scroll',
			'touchstart',
		];
		events.forEach((eventName) =>
			window.addEventListener(eventName, resetInactivityTimer, { passive: true }),
		);
		resetInactivityTimer();

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') checkSession();
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		const syncTimer = setInterval(checkSession, syncPollMs);

		return () => {
			if (inactivityTimer) clearTimeout(inactivityTimer);
			clearInterval(syncTimer);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer));
		};
	}, [enabled, idleMs, syncPollMs, onExpire]);
}
