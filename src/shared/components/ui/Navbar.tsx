'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bars3BottomLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useSidebar, Button, LanguageSwitcher } from '@/shared/components';
import { getAuthCookie } from '@/shared/lib';
import { useABET, useI18n } from '@/providers';
import { useScreen } from '@/shared/hooks';
import { DEFAULT_USER_INITIALS } from '@/shared/constants';
import { TYPE_GROUP_CODES } from '@/modules/ifcs/constants';
import { getTypesByGroupCode } from '@/modules/ifcs/services';
import type { CriticalityOption } from '@/modules/ifcs/services';
import type { NavbarProps, StoredUser } from '@/shared/types';

function readCookieUser(): StoredUser | null {
	if (typeof window === 'undefined') return null;
	const raw = getAuthCookie('token');
	if (!raw) return null;
	try { return JSON.parse(raw) as StoredUser; } catch { return null; }
}

function readCookieSchool(): string {
	if (typeof window === 'undefined') return '';
	const raw = getAuthCookie('escuela');
	if (!raw) return '';
	try { return JSON.parse(raw) as string; } catch { return raw; }
}

const Sep = () => <div className="w-px h-6 bg-zinc-200 flex-shrink-0" />;

function PillSwitcher({
	options,
	selectedProgram,
	onSelectProgram,
	loose = false,
}: {
	options: Array<{ value: string; label: string }>;
	selectedProgram: string;
	onSelectProgram: (value: string) => void;
	loose?: boolean;
}) {
	if (loose) {
		return (
			<div className="flex items-center gap-1 flex-shrink-0">
				{options.map((opt) => {
					const active = selectedProgram === opt.value;
					return (
						<button
							key={opt.value}
							onClick={() => onSelectProgram(opt.value)}
							aria-pressed={active}
							className={`px-5 py-2 rounded-xl text-[14px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap border-[1.5px] ${
								active
									? 'bg-white text-[var(--brand)] border-zinc-200 shadow-sm'
									: 'bg-transparent text-zinc-400 border-transparent shadow-none'
							}`}>
							{opt.label}
						</button>
					);
				})}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-200/80 border border-zinc-300/60 flex-shrink-0">
			{options.map((opt) => {
				const active = selectedProgram === opt.value;
				return (
					<button
						key={opt.value}
						onClick={() => onSelectProgram(opt.value)}
						aria-pressed={active}
						className={`px-3.5 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all duration-150 cursor-pointer border ${
							active
								? 'bg-white text-[var(--brand)] border-[var(--brand-border)] shadow-sm'
								: 'bg-transparent text-zinc-400 border-transparent shadow-none'
						}`}>
						{opt.label}
					</button>
				);
			})}
		</div>
	);
}

function SchoolName({
	short = false,
	label,
	name,
}: {
	short?: boolean;
	label: string;
	name: string;
}) {
	return (
		<div className="flex items-center min-w-0 text-zinc-800 leading-none">
			<span
				className={`font-semibold ${short ? 'text-[14px]' : 'text-[18px]'} flex-shrink-0 text-[var(--brand)]`}>
				{label}:&nbsp;
			</span>
			<span
				className={`font-semibold ${short ? 'text-[12px] max-w-[150px]' : 'text-[14px] max-w-[220px]'}`}>
				&quot;{name}&quot;
			</span>
		</div>
	);
}

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
			<div
				className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0 bg-[var(--brand)]">
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

function Navbar({ schoolName, userName, userRole, userInitials }: NavbarProps) {
	const { toggle, isMobile: isSidebarMobile } = useSidebar();
	const { t, locale } = useI18n();
	const { isMobile, isTablet } = useScreen();
	const { modalityTypeId, setModalityTypeId } = useABET();

	const [storedUser] = useState(readCookieUser);
	const [storedSchoolCode] = useState(readCookieSchool);

	const { data: modalityOptions = [] } = useQuery({
		queryKey: ['types', TYPE_GROUP_CODES.PROGRAM_MODALITY],
		queryFn: () => getTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY),
		staleTime: Infinity,
	});

	useEffect(() => {
		if (modalityOptions.length > 0 && modalityTypeId === null) {
			setModalityTypeId(modalityOptions[0].id);
		}
	}, [modalityOptions, modalityTypeId, setModalityTypeId]);

	const pillOptions = useMemo(
		() =>
			modalityOptions.map((opt) => ({
				value: String(opt.id),
				label: opt.name[locale] ?? opt.name.es ?? opt.code,
			})),
		[modalityOptions, locale],
	);

	const selectedProgramValue = modalityTypeId != null ? String(modalityTypeId) : '';

	function handleSelectProgram(value: string) {
		setModalityTypeId(Number(value));
	}

	const resolvedSchoolName = schoolName ?? storedSchoolCode;

	const resolvedUserName =
		userName ??
		((storedUser ? `${storedUser.first_name ?? ''} ${storedUser.last_name ?? ''}`.trim() : '') ||
			t('navbar.user.name'));

	const resolvedUserRole =
		userRole ??
		((storedUser ? (storedUser.is_admin ? t('navbar.user.role') : '') : '') ||
			t('navbar.user.role'));

	const resolvedUserInitials =
		userInitials ??
		(`${storedUser?.first_name?.trim().charAt(0) ?? ''}${storedUser?.last_name?.trim().charAt(0) ?? ''}`.toUpperCase() ||
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
	const schoolLabelText = t('navbar.school.label');

	if (isMobile) {
		return (
			<nav className={`${navClass} flex flex-col`}>
				<div className="flex items-center justify-between px-4 h-[68px] border-b border-zinc-200">
					<div className="flex items-center gap-3">
						{menuBtn}
						<LanguageSwitcher />
					</div>
					<UserAvatar
						initials={resolvedUserInitials}
						name={resolvedUserName}
						role={resolvedUserRole}
					/>
				</div>
				<div className="flex items-center justify-between px-4 h-14 gap-4">
					<div className="ml-[12px]">
						<SchoolName label={schoolLabelText} name={resolvedSchoolName} />
					</div>
					{pillOptions.length > 0 && (
						<PillSwitcher
							options={pillOptions}
							selectedProgram={selectedProgramValue}
							onSelectProgram={handleSelectProgram}
							loose
						/>
					)}
				</div>
			</nav>
		);
	}

	if (isTablet) {
		return (
			<nav className={`${navClass} h-[90px] flex items-center gap-3 px-4`}>
				{menuBtn}
				<SchoolName label={schoolLabelText} name={resolvedSchoolName} />
				<div className="flex-1" />
				{pillOptions.length > 0 && (
					<PillSwitcher
						options={pillOptions}
						selectedProgram={selectedProgramValue}
						onSelectProgram={handleSelectProgram}
					/>
				)}
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
		<nav className={`${navClass} h-[80px] flex items-center gap-4 px-6`}>
			{menuBtn}
			<SchoolName label={schoolLabelText} name={resolvedSchoolName} />
			<div className="flex-1" />
			{pillOptions.length > 0 && (
				<PillSwitcher
					options={pillOptions}
					selectedProgram={selectedProgramValue}
					onSelectProgram={handleSelectProgram}
				/>
			)}
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
