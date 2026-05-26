import React from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { LocaleProvider, QueryProvider } from '@/providers';
import LayoutClient from '@/app/components/LayoutClient';
import { APP_DESCRIPTION, APP_NAME, DEFAULT_LOCALE } from '@/shared/constants';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata = {
	title: {
		default: APP_NAME,
		template: `%s - ${APP_NAME}`,
	},
	description: APP_DESCRIPTION,
	icons: {
		icon: '/assets/icon_upc.svg',
		shortcut: '/assets/icon_upc.svg',
        apple: '/assets/icon_upc.svg',
	}
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang={DEFAULT_LOCALE}
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
			<body className="h-full bg-zinc-50 text-zinc-900">
				<QueryProvider>
					<LocaleProvider>
						<LayoutClient>{children}</LayoutClient>
					</LocaleProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
