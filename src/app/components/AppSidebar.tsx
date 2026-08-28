'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
	Sidebar,
	SidebarHeader,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarItem,
	SidebarNavGroup,
	Toast,
} from '@/shared/components';
import {
	HomeIcon,
	ArrowRightStartOnRectangleIcon,
	ClipboardDocumentListIcon,
	ClipboardDocumentCheckIcon,
	DocumentChartBarIcon,
	ShieldCheckIcon,
	DocumentCheckIcon,
	ArrowUpTrayIcon,
	AcademicCapIcon,
	BriefcaseIcon,
	CircleStackIcon,
	ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth, useI18n } from '@/providers';
import { useLogout } from '@/modules/auth/hooks';
import { useApiErrorToast } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib';
import { getPortfolioSsoLink } from '@/modules/admin/portfolio-integration';

type NavChild = {
	name: string;
	href: string;
};

type NavItem = {
	name: string;
	href?: string;
	onClick?: () => void;
	icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
	children?: NavChild[];
};

export function AppSidebar() {
	const pathname = usePathname();
	const { t } = useI18n();
	const { canAccessRoute } = useAuth();
	const handleLogout = useLogout();
	const { toast, showToast, clearToast } = useApiErrorToast();

	async function handlePortfolioClick() {
		const popup = window.open('', '_blank');
		try {
			const { url } = await getPortfolioSsoLink();
			if (popup) popup.location.href = url;
			else window.open(url, '_blank');
		} catch (err) {
			popup?.close();
			showToast(getErrorMessage(err, 'admin.portfolioIntegration.error.linkFailed'), 'error');
		}
	}

	const navigation: NavItem[] = [
		{ name: t('nav.home'), href: '/', icon: HomeIcon },
		{
			name: t('nav.rubrics'),
			icon: DocumentCheckIcon,
			children: [
				{ name: t('nav.evaluationCourses'), href: '/rubrics/evaluation-courses' },
				{ name: t('nav.rubricsList'), href: '/rubrics' },
			],
		},
		{
			name: t('nav.academicProjects.label'),
			icon: AcademicCapIcon,
			children: [
				{ name: t('nav.academicProjects.evaluators'), href: '/academic-projects/evaluators' },
				{
					name: t('nav.academicProjects.projectGroups'),
					href: '/academic-projects/project-groups',
				},
				{ name: t('nav.projects'), href: '/academic-projects/projects' },
			],
		},
		{
			name: t('nav.evaluation.label'),
			icon: ClipboardDocumentCheckIcon,
			children: [
				{ name: t('nav.gradeProjects'), href: '/evaluation/grade-projects' },
				{ name: t('nav.performanceReports'), href: '/evaluation/performance-reports' },
			],
		},
		{
			name: t('nav.portfolio'),
			href: '/portfolio',
			onClick: handlePortfolioClick,
			icon: BriefcaseIcon,
		},

		{
			name: t('nav.ifc.label'),
			icon: DocumentChartBarIcon,
			children: [
				{ name: t('nav.ifc.overview'), href: '/ifcs' },
				{ name: t('nav.ifc.findings'), href: '/ifc-findings' },
			],
		},

		{
			name: t('nav.ard.label'),
			icon: ChatBubbleLeftRightIcon,
			children: [
				{ name: t('nav.ard.overview'), href: '/ard' },
				{ name: t('nav.ard.reports'), href: '/ard/reports' },
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

		{ name: t('nav.banner'), href: '/scrapping', icon: CircleStackIcon },

		{
			name: t('nav.admin.label'),
			icon: ShieldCheckIcon,
			children: [
				{ name: t('nav.admin.parameters'), href: '/admin/parameters' },
				{ name: t('nav.admin.notifications'), href: '/admin/notifications' },
				{ name: t('nav.admin.configuration'), href: '/admin/configuration' },
				{ name: t('nav.admin.iam'), href: '/admin/iam' },
				{
					name: t('nav.admin.portfolioIntegration'),
					href: '/admin/portfolio-integration',
				},
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
		<>
			<Sidebar>
				<SidebarHeader />

				<SidebarContent>
					<SidebarGroup>
						{visibleNavigation.map((item) => {
							const childActive = item.children?.some((child) => isActive(child.href)) ?? false;

							return (
								<div key={item.name}>
									{!item.children && item.onClick ? (
										<SidebarItem
											label={item.name}
											icon={<item.icon className="h-5 w-5" />}
											onClick={item.onClick}
										/>
									) : !item.children ? (
										<SidebarItem
											label={item.name}
											icon={<item.icon className="h-5 w-5" />}
											href={item.href ?? '#'}
											active={isActive(item.href)}
										/>
									) : (
										<SidebarNavGroup
											label={item.name}
											icon={<item.icon className="h-5 w-5" />}
											active={childActive}
											defaultOpen={childActive}>
											{item.children.map((child) => (
												<SidebarItem
													key={child.name}
													label={child.name}
													icon={null}
													href={child.href}
													active={isActive(child.href)}
												/>
											))}
										</SidebarNavGroup>
									)}
								</div>
							);
						})}
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter>
					<SidebarItem
						label={t('nav.logout')}
						icon={<ArrowRightStartOnRectangleIcon className="h-5 w-5" />}
						onClick={handleLogout}
					/>
				</SidebarFooter>
			</Sidebar>
			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</>
	);
}

export default AppSidebar;
