'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
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

function subscribeStoredUser(onStoreChange: () => void) {
	if (typeof window === 'undefined') return () => {};
	window.addEventListener('storage', onStoreChange);
	return () => window.removeEventListener('storage', onStoreChange);
}

function readStoredUserRaw() {
	if (typeof window === 'undefined') return '';
	return getAuthCookie('token');
}

function readStoredSchoolCodeRaw() {
	if (typeof window === 'undefined') return '';
	return getAuthCookie('escuela');
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
							className="px-5 py-2 rounded-xl text-[14px] font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap"
							style={{
								background: active ? '#fff' : 'transparent',
								color: active ? '#C8102E' : '#a1a1aa',
								border: active ? '1.5px solid #e2e2e6' : '1.5px solid transparent',
								boxShadow: active ? '0 1px 5px rgba(0,0,0,0.08)' : 'none',
							}}>
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
						className="px-3.5 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all duration-150 cursor-pointer border"
						style={{
							background: active ? '#fff' : 'transparent',
							color: active ? '#C8102E' : '#a1a1aa',
							borderColor: active ? 'rgba(200,16,46,0.15)' : 'transparent',
							boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
						}}>
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
				className={`font-semibold ${short ? 'text-[14px]' : 'text-[18px]'} flex-shrink-0`}
				style={{ color: '#C8102E' }}>
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
			className="flex items-center gap-2 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors flex-shrink-0"
			style={{ padding: withName ? '4px 8px 4px 4px' : '4px 6px 4px 4px' }}>
			<div
				className="w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-extrabold text-white flex-shrink-0"
				style={{ background: '#C8102E' }}>
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

	const storedUserRaw = useSyncExternalStore(subscribeStoredUser, readStoredUserRaw, () => '');
	const storedSchoolCodeRaw = useSyncExternalStore(
		subscribeStoredUser,
		readStoredSchoolCodeRaw,
		() => '',
	);

	const [modalityOptions, setModalityOptions] = useState<CriticalityOption[]>([]);

	const storedUser = useMemo<StoredUser | null>(() => {
		if (!storedUserRaw) return null;
		try {
			return JSON.parse(storedUserRaw) as StoredUser;
		} catch {
			return null;
		}
	}, [storedUserRaw]);

	const storedSchoolCode = useMemo(() => {
		if (!storedSchoolCodeRaw) return '';
		try {
			return JSON.parse(storedSchoolCodeRaw) as string;
		} catch {
			return storedSchoolCodeRaw;
		}
	}, [storedSchoolCodeRaw]);

	useEffect(() => {
		let active = true;
		getTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY)
			.then((rows) => {
				if (!active) return;
				setModalityOptions(rows);
				if (rows.length > 0 && modalityTypeId === null) {
					setModalityTypeId(rows[0].id);
				}
			})
			.catch(() => {
				if (active) setModalityOptions([]);
			});
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
