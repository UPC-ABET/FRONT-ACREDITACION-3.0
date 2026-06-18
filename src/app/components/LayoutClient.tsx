'use client';

import React, { ReactNode } from 'react';
import { Navbar } from '@/shared/components';
import AppSidebar from '@/app/components/AppSidebar';
import {
	ABETProvider,
	GlobalFiltersVisibilityProvider,
	SchoolSourceProvider,
	SidebarProvider,
} from '@/providers';
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
			<GlobalFiltersVisibilityProvider>
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

								<main className="flex-1 overflow-y-auto bg-white px-4 py-6 lg:px-6">
									<div className="w-full">{children}</div>
								</main>
							</div>
						</div>
					</SidebarProvider>
				</SchoolSourceProvider>
			</GlobalFiltersVisibilityProvider>
		</ABETProvider>
	);
}
