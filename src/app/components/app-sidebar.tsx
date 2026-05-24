'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarItem,
	SidebarNavGroup,
} from '@/shared/components';
import {
	HomeIcon,
	Cog6ToothIcon,
	ArrowRightStartOnRectangleIcon,
	ClipboardDocumentListIcon,
	DocumentChartBarIcon,
	ShieldCheckIcon,
	DocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { useI18n } from '@/providers';
import { useIsAdmin, useLogout } from '@/shared/hooks';

type NavChild = {
	name: string;
	href: string;
};

type NavItem = {
	name: string;
	href?: string;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	children?: NavChild[];
};

export function AppSidebar() {
	const pathname = usePathname();
	const { t } = useI18n();
	const isAdmin = useIsAdmin();
	const handleLogout = useLogout();

	const isActive = (href?: string) => (href ? pathname === href : false);

	const navigation: NavItem[] = [
		{ name: t('nav.home'), href: '/', icon: HomeIcon },
		{
			name: t('nav.rubrics'),
			icon: DocumentCheckIcon,
			children: [
				{ name: t('nav.rubricsList'), href: '/rubrics' },
				{ name: t('nav.evaluationCourses'), href: '/rubrics/evaluation-courses' },
				{ name: t('nav.performanceLevels'), href: '/rubrics/performance-levels' },
				{ name: t('nav.projects'), href: '/projects' },
				{ name: t('nav.gradeProjects'), href: '/grade-projects' },
			],
		},
		{
			name: t('nav.ifc.label'),
			icon: DocumentChartBarIcon,
			children: [
				{ name: t('nav.ifc.dashboard'), href: '/ifcs' },
				{ name: t('nav.ifc.findings'), href: '/ifc-findings' },
			],
		},

		{
			name: t('nav.surveys.label'),
			icon: ClipboardDocumentListIcon,
			children: [
				{ name: t('nav.surveys.ppp'), href: '/surveys/ppp' },
				{ name: t('nav.surveys.gra'), href: '/surveys/gra' },
				{ name: t('nav.surveys.lcfc'), href: '/surveys/lcfc' },
			],
		},

		{
			name: t('nav.tests.label'),
			icon: Cog6ToothIcon,
			children: [
				{ name: t('nav.tests.modals'), href: '/tests/modals' },
				{ name: t('nav.tests.charts'), href: '/tests/charts' },
				{ name: t('nav.tests.tables'), href: '/tests/tables' },
				{ name: t('nav.tests.public'), href: '/tests/public' },
			],
		},

		...(isAdmin
			? [
					{
						name: t('nav.admin.label'),
						icon: ShieldCheckIcon,
						children: [
							{ name: t('nav.admin.notifications'), href: '/admin/ifc-notification-config' },
							{ name: t('nav.admin.ifcCodes'), href: '/admin/ifc-codes' },
							{ name: t('nav.admin.ifcFields'), href: '/admin/ifc-fields' },
						],
					} as NavItem,
				]
			: []),
	];

	return (
		<Sidebar>
			<SidebarHeader />

			<SidebarContent>
				<SidebarGroup>
					{navigation.map((item) => {
						const childActive = item.children?.some((child) => isActive(child.href)) ?? false;

						return (
							<div key={item.name}>
								{!item.children ? (
									<Link href={item.href ?? '#'}>
										<SidebarItem
											label={item.name}
											icon={<item.icon className="h-5 w-5" />}
											active={isActive(item.href)}
										/>
									</Link>
								) : (
									<SidebarNavGroup
										label={item.name}
										icon={<item.icon className="h-5 w-5" />}
										active={childActive}
										defaultOpen={childActive}>
										{item.children.map((child) => (
											<Link key={child.name} href={child.href}>
												<SidebarItem label={child.name} icon={null} active={isActive(child.href)} />
											</Link>
										))}
									</SidebarNavGroup>
								)}
							</div>
						);
					})}
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter>
				<button type="button" onClick={handleLogout} className="w-full text-left">
					<SidebarItem
						label={t('nav.logout')}
						icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
					/>
				</button>
			</SidebarFooter>
		</Sidebar>
	);
}

export default AppSidebar;
