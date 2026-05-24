import { useEffect, useRef } from 'react';
import { getAuthCookie } from '@/shared/lib';

type UseSessionExpiryParams = {
	enabled: boolean;
	onExpire: () => void;
	idleMs?: number;
};

const DEFAULT_IDLE_MS = 60 * 60 * 1000;

function getStoredToken(): string {
	const raw = getAuthCookie('bearerToken');
	if (!raw) return '';
	try {
		return JSON.parse(raw) as string;
	} catch {
		return '';
	}
}

function getJwtExpirationMs(token: string): number | null {
	try {
		const parts = token.split('.');
		if (parts.length < 2) return null;
		const payload = JSON.parse(atob(parts[1])) as { exp?: number };
		return payload.exp ? payload.exp * 1000 : null;
	} catch {
		return null;
	}
}

export function useSessionExpiry({
	enabled,
	onExpire,
	idleMs = DEFAULT_IDLE_MS,
}: UseSessionExpiryParams) {
	const expiredRef = useRef(false);

	useEffect(() => {
		if (!enabled) return;

		const token = getStoredToken();
		if (!token) return;

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

		const expAt = getJwtExpirationMs(token);
		if (expAt) {
			const remaining = expAt - Date.now();
			if (remaining <= 0) {
				setTimeout(runExpire, 0);
			} else {
				tokenTimer = setTimeout(runExpire, remaining);
			}
		}

		const syncTimer = setInterval(() => {
			if (!getStoredToken()) runExpire();
		}, 5000);

		return () => {
			if (inactivityTimer) clearTimeout(inactivityTimer);
			if (tokenTimer) clearTimeout(tokenTimer);
			clearInterval(syncTimer);
			events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer));
		};
	}, [enabled, idleMs, onExpire]);
}
