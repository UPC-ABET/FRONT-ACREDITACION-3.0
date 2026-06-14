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
	ArrowRightStartOnRectangleIcon,
	ClipboardDocumentListIcon,
	DocumentChartBarIcon,
	ShieldCheckIcon,
	DocumentCheckIcon,
	ArrowUpTrayIcon,
	AcademicCapIcon,
	BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useAuth, useI18n } from '@/providers';
import { useLogout } from '@/modules/auth/hooks';

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
	const { canAccessRoute } = useAuth();
	const handleLogout = useLogout();

	const navigation: NavItem[] = [
		{ name: t('nav.home'), href: '/', icon: HomeIcon },
		{
			name: t('nav.rubrics'),
			icon: DocumentCheckIcon,
			children: [
				{ name: t('nav.rubricsList'), href: '/rubrics' },
				{ name: t('nav.evaluationCourses'), href: '/rubrics/evaluation-courses' },
			],
		},
		{
			name: t('nav.evaluation.label'),
			icon: AcademicCapIcon,
			children: [
				{ name: t('nav.projects'), href: '/evaluation/projects' },
				{ name: t('nav.gradeProjects'), href: '/evaluation/grade-projects' },
			],
		},
		{ name: t('nav.portfolio'), href: '/portfolio', icon: BriefcaseIcon },

		{
			name: t('nav.ifc.label'),
			icon: DocumentChartBarIcon,
			children: [
				{ name: t('nav.ifc.overview'), href: '/ifcs' },
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
			name: t('nav.loads.label'),
			icon: ArrowUpTrayIcon,
			children: [
				{ name: t('nav.loads.upload'), href: '/loads' },
				{ name: t('nav.loads.history'), href: '/loads/history' },
			],
		},

		{
			name: t('nav.admin.label'),
			icon: ShieldCheckIcon,
			children: [
				{ name: t('nav.admin.parameters'), href: '/admin/parameters' },
				{ name: t('nav.admin.notifications'), href: '/admin/notifications' },
				{ name: t('nav.admin.configuration'), href: '/admin/configuration' },
				{ name: t('nav.admin.iam'), href: '/admin/iam' },
			],
		},
	];

	const matchesHref = (href: string) =>
		pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

	const allHrefs = navigation.flatMap((item) =>
		item.children ? item.children.map((child) => child.href) : item.href ? [item.href] : [],
	);

	const activeHref = allHrefs.filter(matchesHref).sort((a, b) => b.length - a.length)[0] ?? null;

	const isActive = (href?: string) => Boolean(href) && href === activeHref;

	const visibleNavigation = navigation
		.map((item) => {
			if (item.children) {
				const children = item.children.filter((child) => canAccessRoute(child.href));
				return children.length > 0 ? { ...item, children } : null;
			}
			return canAccessRoute(item.href ?? '#') ? item : null;
		})
		.filter((item): item is NavItem => item !== null);

	return (
		<Sidebar>
			<SidebarHeader />

			<SidebarContent>
				<SidebarGroup>
					{visibleNavigation.map((item) => {
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
