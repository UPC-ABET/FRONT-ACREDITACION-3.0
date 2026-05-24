'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar, SessionExpiredAlert } from '@/shared/components';
import AppSidebar from '@/app/components/app-sidebar';
import { ABETProvider, SidebarProvider } from '@/providers';
import { clearClientSession, logoutUser } from '@/modules/auth/services';
import { useSessionExpiry } from '@/shared/hooks';
import { getAuthCookie } from '@/shared/lib';

type LayoutClientProps = {
	children: ReactNode;
};

export default function LayoutClient({ children }: LayoutClientProps) {
	const pathname = usePathname();
	const isAuthRoute = pathname?.startsWith('/auth') ?? false;
	const isSurveyPublicRoute = pathname?.startsWith('/survey/') ?? false;

	const [mounted, setMounted] = useState(false);
	const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	const getStoredToken = () => {
		const raw = getAuthCookie('bearerToken');
		if (!raw) return '';

		try {
			const parsed = JSON.parse(raw);
			return typeof parsed === 'string' ? parsed : raw;
		} catch {
			return raw;
		}
	};

	const expireSession = () => {
		clearClientSession();
		setIsAuthenticated(false);
		setSessionExpiredOpen(true);
		window.location.replace('/auth/login');
	};

	const handleGoToLogin = async () => {
		try {
			await logoutUser();
		} catch {}

		clearClientSession();
		setIsAuthenticated(false);
		setSessionExpiredOpen(false);
		window.location.replace('/auth/login');
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		if (isSurveyPublicRoute) return;

		const hasToken = Boolean(getStoredToken());
		setIsAuthenticated(hasToken);

		if (hasToken && isAuthRoute) {
			window.location.replace('/');
			return;
		}

		if (!hasToken && !isAuthRoute) {
			window.location.replace('/auth/login');
		}
	}, [mounted, pathname, isAuthRoute, isSurveyPublicRoute]);

	useSessionExpiry({
		enabled: mounted && !isAuthRoute && !isSurveyPublicRoute && isAuthenticated,
		onExpire: expireSession,
	});

	if (isSurveyPublicRoute) {
		return <>{children}</>;
	}

	if (!mounted) return null;

	if (isAuthRoute) {
		if (isAuthenticated) return null;
		return <>{children}</>;
	}

	if (!isAuthenticated) return null;

	return (
		<ABETProvider>
			<SidebarProvider>
				<div className="flex h-screen w-full overflow-hidden">
					<div data-layout-sidebar="true">
						<AppSidebar />
					</div>

					<div className="flex flex-col flex-1 h-full overflow-hidden">
						<div data-layout-navbar="true">
							<Navbar />
						</div>

						<main className="flex-1 p-8 overflow-y-auto bg-white">
							<div className="max-w-7xl mx-auto">{children}</div>
						</main>
					</div>
				</div>

				<SessionExpiredAlert isOpen={sessionExpiredOpen} onLogout={handleGoToLogin} />
			</SidebarProvider>
		</ABETProvider>
	);
}
