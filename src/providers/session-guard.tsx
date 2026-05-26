'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SessionExpiredAlert } from '@/shared/components';
import { useAuth } from '@/providers/auth-provider';
import { useSessionExpiry } from '@/shared/hooks';
import { logoutUser } from '@/modules/auth/services';
import { clearPreferenceCookies, safeRedirect } from '@/shared/lib';

type SessionGuardState = {
	mounted: boolean;
	showApp: boolean;
	showAuth: boolean;
	showPublic: boolean;
};

const SessionGuardContext = createContext<SessionGuardState | null>(null);

export function SessionGuard({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { isAuthenticated, isLoading, clearUser } = useAuth();

	const isAuthRoute = pathname?.startsWith('/auth') ?? false;
	const isSurveyPublicRoute = pathname?.startsWith('/survey/') ?? false;

	const [mounted, setMounted] = useState(false);
	const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

	const expireSession = useCallback(() => {
		clearUser();
		clearPreferenceCookies();
		setSessionExpiredOpen(true);
		safeRedirect('/auth/login');
	}, [clearUser]);

	const handleGoToLogin = useCallback(async () => {
		try {
			await logoutUser();
		} catch {}

		clearUser();
		clearPreferenceCookies();
		setSessionExpiredOpen(false);
		safeRedirect('/auth/login');
	}, [clearUser]);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted || isLoading) return;
		if (isSurveyPublicRoute) return;

		if (isAuthenticated && isAuthRoute) {
			router.replace('/');
			return;
		}

		if (!isAuthenticated && !isAuthRoute) {
			router.replace('/auth/login');
		}
	}, [mounted, isLoading, isAuthenticated, pathname, isAuthRoute, isSurveyPublicRoute, router]);

	useSessionExpiry({
		enabled: mounted && !isAuthRoute && !isSurveyPublicRoute && isAuthenticated,
		onExpire: expireSession,
	});

	const value = useMemo<SessionGuardState>(() => {
		if (isSurveyPublicRoute) return { mounted, showApp: false, showAuth: false, showPublic: true };
		if (!mounted || isLoading) return { mounted, showApp: false, showAuth: false, showPublic: false };
		if (isAuthRoute) return { mounted, showApp: false, showAuth: !isAuthenticated, showPublic: false };
		return { mounted, showApp: isAuthenticated, showAuth: false, showPublic: false };
	}, [mounted, isLoading, isAuthenticated, isAuthRoute, isSurveyPublicRoute]);

	return (
		<SessionGuardContext.Provider value={value}>
			{children}
			<SessionExpiredAlert isOpen={sessionExpiredOpen} onLogout={handleGoToLogin} />
		</SessionGuardContext.Provider>
	);
}

export function useSessionGuard(): SessionGuardState {
	const ctx = useContext(SessionGuardContext);
	if (!ctx) throw new Error('useSessionGuard must be used within SessionGuard');
	return ctx;
}
