'use client';

import React, { ReactNode } from 'react';
import { Navbar } from '@/shared/components';
import AppSidebar from '@/app/components/AppSidebar';
import { ABETProvider, SchoolSourceProvider, SidebarProvider } from '@/providers';
import { useSessionGuard } from '@/providers/SessionGuard';

type LayoutClientProps = {
	children: ReactNode;
};

export default function LayoutClient({ children }: LayoutClientProps) {
	const { showApp, showAuth, showPublic } = useSessionGuard();

	if (showPublic || showAuth) {
		return <>{children}</>;
	}

	if (!showApp) return null;

	return (
		<ABETProvider>
			<SchoolSourceProvider>
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
				</SidebarProvider>
			</SchoolSourceProvider>
		</ABETProvider>
	);
}
