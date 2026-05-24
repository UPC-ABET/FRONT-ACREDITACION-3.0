import { useEffect, useRef } from 'react';
import { getAuthCookie, getTokenExpiry } from '@/shared/lib';

type UseSessionExpiryParams = {
	enabled: boolean;
	onExpire: () => void;
	idleMs?: number;
};

const DEFAULT_IDLE_MS = 60 * 60 * 1000;

export function useSessionExpiry({
	enabled,
	onExpire,
	idleMs = DEFAULT_IDLE_MS,
}: UseSessionExpiryParams) {
	const expiredRef = useRef(false);

	useEffect(() => {
		if (!enabled) return;

		if (!getAuthCookie('token')) return;

		const runExpire = () => {
			if (expiredRef.current) return;
			expiredRef.current = true;
			onExpire();
		};

		let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
		let tokenTimer: ReturnType<typeof setTimeout> | null = null;

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

		const expAt = getTokenExpiry();
		if (expAt) {
			const remaining = expAt - Date.now();
			if (remaining <= 0) {
				setTimeout(runExpire, 0);
			} else {
				tokenTimer = setTimeout(runExpire, remaining);
			}
		}

		const syncTimer = setInterval(() => {
			if (!getAuthCookie('token')) runExpire();
		}, 5000);

		return () => {
			if (inactivityTimer) clearTimeout(inactivityTimer);
			if (tokenTimer) clearTimeout(tokenTimer);
			clearInterval(syncTimer);
			events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer));
		};
	}, [enabled, idleMs, onExpire]);
}
