'use client';

import { Bars3BottomLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useSidebar, Button, LanguageSwitcher } from '@/shared/components';
import { useAuth, useI18n } from '@/providers';
import { useScreen } from '@/shared/hooks';
import { DEFAULT_USER_INITIALS } from '@/shared/constants';
import { GlobalAcademicFilters } from '@/modules/academic/components';
import type { NavbarProps } from '@/shared/types';

const Sep = () => <div className="w-px h-6 bg-zinc-200 flex-shrink-0" />;

function UserAvatar({
	withName = false,
	withChevron = false,
	initials,
	name,
	role,
}: {
	withName?: boolean;
	withChevron?: boolean;
	initials: string;
	name: string;
	role: string;
}) {
	return (
		<div
			className={`flex items-center gap-2 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors flex-shrink-0 ${withName ? 'py-1 pl-1 pr-2' : 'py-1 pl-1 pr-1.5'}`}>
			<div className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0 bg-[var(--brand)]">
				{initials}
			</div>
			{withName && (
				<div className="flex flex-col leading-none gap-0.5 min-w-0">
					<span className="text-[12px] font-semibold text-zinc-800 truncate max-w-[140px]">
						{name}
					</span>
					{role && <span className="text-[10px] text-zinc-400 truncate max-w-[140px]">{role}</span>}
				</div>
			)}
			{withChevron && <ChevronDownIcon className="h-4 w-4 text-zinc-400 flex-shrink-0" />}
		</div>
	);
}

function Navbar({ userName, userRole, userInitials }: NavbarProps) {
	const { toggle, isMobile: isSidebarMobile } = useSidebar();
	const { t } = useI18n();
	const { isMobile, isTablet } = useScreen();
	const { user } = useAuth();

	const resolvedUserName =
		userName ??
		((user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '') ||
			t('navbar.user.name'));

	const resolvedUserRole = userRole ?? t('navbar.user.role');

	const resolvedUserInitials =
		userInitials ??
		(`${user?.firstName?.trim().charAt(0) ?? ''}${user?.lastName?.trim().charAt(0) ?? ''}`.toUpperCase() ||
			DEFAULT_USER_INITIALS);

	const menuBtn = isSidebarMobile ? (
		<Button
			type="button"
			onClick={toggle}
			aria-label={t('navbar.openMenu')}
			variant="ghost"
			size="sm"
			className="h-9 w-9 p-0 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/70 transition-colors flex-shrink-0">
			<Bars3BottomLeftIcon className="h-6 w-6" />
		</Button>
	) : null;

	const navClass = 'w-full sticky top-0 z-30 bg-[#f8f8f9] border-b border-zinc-200';

	if (isMobile) {
		return (
			<nav className={`${navClass} flex h-[72px] items-center gap-3 px-4`}>
				{menuBtn}
				<div className="min-w-0 flex-1 overflow-visible">
					<GlobalAcademicFilters embedded />
				</div>
				<LanguageSwitcher />
				<UserAvatar
					initials={resolvedUserInitials}
					name={resolvedUserName}
					role={resolvedUserRole}
				/>
			</nav>
		);
	}

	if (isTablet) {
		return (
			<nav className={`${navClass} flex h-[72px] items-center gap-3 px-4`}>
				{menuBtn}
				<div className="min-w-0 flex-1 overflow-visible">
					<GlobalAcademicFilters embedded />
				</div>
				<Sep />
				<LanguageSwitcher />
				<Sep />
				<UserAvatar
					initials={resolvedUserInitials}
					name={resolvedUserName}
					role={resolvedUserRole}
				/>
			</nav>
		);
	}

	return (
		<nav className={`${navClass} flex h-[72px] items-center gap-4 px-6`}>
			{menuBtn}
			<div className="min-w-0 flex-1 overflow-visible">
				<GlobalAcademicFilters embedded />
			</div>
			<Sep />
			<LanguageSwitcher />
			<Sep />
			<UserAvatar
				withName
				initials={resolvedUserInitials}
				name={resolvedUserName}
				role={resolvedUserRole}
			/>
		</nav>
	);
}

export { Navbar };
