'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bars3BottomLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useSidebar, Button, LanguageSwitcher, Select } from '@/shared/components';
import { getSchoolCookie, setSchoolCookie } from '@/shared/lib';
import { useABET, useAuth, useI18n } from '@/providers';
import { useScreen } from '@/shared/hooks';
import { DEFAULT_USER_INITIALS, TYPE_CODES, TYPE_GROUP_CODES } from '@/shared/constants';
import { getTypesByGroupCode } from '@/modules/core';
import { SCHOOL_LABEL_KEYS_BY_CODE } from '@/modules/auth/constants';
import type { NavbarProps } from '@/shared/types';

type SchoolOption = {
	value: string;
	label: string;
};

function readCookieSchoolCode(): string {
	const school = getSchoolCookie();
	const schoolCode = school?.code as string | undefined;
	return typeof schoolCode === 'string' ? schoolCode : '';
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

function SchoolSelector({
	short = false,
	label,
	options,
	value,
	onChange,
}: {
	short?: boolean;
	label: string;
	options: SchoolOption[];
	value: SchoolOption | null;
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex items-center gap-2 min-w-0 text-zinc-800">
			<span
				className={`font-semibold ${short ? 'text-[14px]' : 'text-[18px]'} flex-shrink-0 text-[var(--brand)]`}>
				{label}:
			</span>
			<div className={`${short ? 'w-[180px]' : 'w-[260px]'} max-w-[55vw]`}>
				<Select
					name="school"
					value={value}
					options={options}
					size="sm"
					isSearchable
					isDisabled={options.length === 0}
					placeholder={label}
					onChange={(_, selected) => {
						if (!selected || Array.isArray(selected)) return;
						onChange(String(selected.value));
					}}
				/>
			</div>
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
	const { t, locale } = useI18n();
	const { isMobile, isTablet } = useScreen();
	const { modalityTypeId, setModalityTypeId } = useABET();
	const { user, userSchools, changeModalityCode } = useAuth();

	const [selectedSchoolCode, setSelectedSchoolCode] = useState(readCookieSchoolCode);

	const { data: modalityOptions = [] } = useQuery({
		queryKey: ['types', TYPE_GROUP_CODES.PROGRAM_MODALITY],
		queryFn: () => getTypesByGroupCode(TYPE_GROUP_CODES.PROGRAM_MODALITY),
		staleTime: Infinity,
	});

	useEffect(() => {
		if (modalityOptions.length > 0 && modalityTypeId === null) {
			const defaultOption =
				modalityOptions.find((option) => option.code === TYPE_CODES.PROGRAM_MODALITY.REGULAR) ??
				modalityOptions[0];
			setModalityTypeId(defaultOption.id);
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
		const selectedId = Number(value);
		setModalityTypeId(selectedId);
		const selectedModality = modalityOptions.find((option) => option.id === selectedId);
		if (selectedModality) {
			changeModalityCode(selectedModality.code);
		}
	}

	const schoolOptions = useMemo(
		() =>
			userSchools.map((school) => {
				const labelKey = SCHOOL_LABEL_KEYS_BY_CODE[school.code];
				const translatedLabel = labelKey ? t(labelKey) : '';
				const fallbackLabel =
					school.name[locale] ?? school.name.es ?? school.name.en ?? school.code;
				return {
					value: school.code,
					label: translatedLabel && translatedLabel !== labelKey ? translatedLabel : fallbackLabel,
				};
			}),
		[userSchools, locale, t],
	);

	const selectedSchool =
		userSchools.find((school) => school.code === selectedSchoolCode) ?? userSchools[0] ?? null;

	const selectedSchoolOption =
		schoolOptions.find((option) => option.value === selectedSchool?.code) ?? null;

	function handleSelectSchool(value: string) {
		const school = userSchools.find((item) => item.code === value);
		if (!school) return;
		setSelectedSchoolCode(school.code);
		setSchoolCookie(school);
	}

	useEffect(() => {
		if (!selectedSchool) return;
		setSchoolCookie(selectedSchool);
	}, [selectedSchool]);

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
						<SchoolSelector
							short
							label={schoolLabelText}
							options={schoolOptions}
							value={selectedSchoolOption}
							onChange={handleSelectSchool}
						/>
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
				<SchoolSelector
					short
					label={schoolLabelText}
					options={schoolOptions}
					value={selectedSchoolOption}
					onChange={handleSelectSchool}
				/>
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
			<SchoolSelector
				label={schoolLabelText}
				options={schoolOptions}
				value={selectedSchoolOption}
				onChange={handleSelectSchool}
			/>
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
