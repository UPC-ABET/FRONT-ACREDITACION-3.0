'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar, SessionExpiredAlert } from '@/shared/components';
import AppSidebar from '@/app/components/app-sidebar';
import { ABETProvider, SidebarProvider, useAuth } from '@/providers';
import { logoutUser } from '@/modules/auth/services';
import { useSessionExpiry } from '@/shared/hooks';
import { clearPreferenceCookies, safeRedirect } from '@/shared/lib';

type LayoutClientProps = {
	children: ReactNode;
};

export default function LayoutClient({ children }: LayoutClientProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { isAuthenticated, isLoading, clearUser } = useAuth();
	const isAuthRoute = pathname?.startsWith('/auth') ?? false;
	const isSurveyPublicRoute = pathname?.startsWith('/survey/') ?? false;

	const [mounted, setMounted] = useState(false);
	const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

	const expireSession = () => {
		clearUser();
		clearPreferenceCookies();
		setSessionExpiredOpen(true);
		safeRedirect('/auth/login');
	};

	const handleGoToLogin = async () => {
		try {
			await logoutUser();
		} catch {}

		clearUser();
		clearPreferenceCookies();
		setSessionExpiredOpen(false);
		safeRedirect('/auth/login');
	};

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

	if (isSurveyPublicRoute) {
		return <>{children}</>;
	}

	if (!mounted || isLoading) return null;

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
