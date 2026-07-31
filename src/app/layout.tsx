import React from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import {
	AuthProvider,
	LocaleProvider,
	QueryProvider,
	SessionGuard,
	GlobalFiltersVisibilityProvider,
} from '@/providers';
import LayoutClient from '@/app/components/LayoutClient';
import { getServerLocale, translateServer } from '@/shared/lib/serverLocale';

// TODO (tech debt): app-wide force-dynamic to bypass Next 16's `useSearchParams()`
// prerender bailout. Works because this is an auth-gated, client-rendered SPA, but
// it disables static optimization for ALL routes. Refine by scoping dynamic
// rendering to only the pages that need it (per-page Suspense / route config),
// then remove this.
export const dynamic = 'force-dynamic';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
	const appName = await translateServer('app.name');

	return {
		title: {
			default: appName,
			template: `%s - ${appName}`,
		},
		description: await translateServer('app.description'),
		icons: {
			icon: '/assets/icon_upc.svg',
			shortcut: '/assets/icon_upc.svg',
			apple: '/assets/icon_upc.svg',
		},
	};
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getServerLocale();

	return (
		<html
			lang={locale}
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
			<body className="h-full bg-zinc-50 text-zinc-900">
				<QueryProvider>
					<LocaleProvider>
						<AuthProvider>
							<GlobalFiltersVisibilityProvider>
								<SessionGuard>
									<LayoutClient>{children}</LayoutClient>
								</SessionGuard>
							</GlobalFiltersVisibilityProvider>
						</AuthProvider>
					</LocaleProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
