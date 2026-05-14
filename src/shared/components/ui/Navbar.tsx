'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Bars3BottomLeftIcon } from '@heroicons/react/24/outline'
import { useSidebar, Button, LanguageSwitcher } from '@/shared/components'
import { useI18n } from '@/providers'
import { useScreen } from '@/shared/hooks'
import { DEFAULT_CYCLE_LABEL, DEFAULT_PROGRAM_OPTIONS, DEFAULT_PROGRAM_TYPE, DEFAULT_USER_INITIALS } from '@/shared/constants'

type ProgramOption = {
    value: string
    label?: string
    labelKey?: string
}

type NavbarProps = {
    cycleLabel?: string
    schoolName?: string
    programType?: string
    programOptions?: ProgramOption[]
    userName?: string
    userRole?: string
    userInitials?: string
}

type StoredUser = {
    first_name?: string
    last_name?: string
    is_admin?: boolean
}

function Navbar({
                    cycleLabel,
                    schoolName,
                    programType,
                    programOptions,
                    userName,
                    userRole,
                    userInitials,
                }: NavbarProps) {
    const { toggle, isMobile: isSidebarMobile } = useSidebar()
    const { t } = useI18n()
    const { isMobile, isTablet } = useScreen()

    const [storedUser, setStoredUser] = useState<StoredUser | null>(null)

    useEffect(() => {
        const raw = localStorage.getItem('token')
        if (!raw) return
        try {
            const parsed = JSON.parse(raw) as StoredUser
            setStoredUser(parsed)
        } catch {
            setStoredUser(null)
        }
    }, [])

    const resolvedProgramType = programType ?? DEFAULT_PROGRAM_TYPE
    const resolvedProgramOptions = useMemo(() => {
        const options = programOptions ?? DEFAULT_PROGRAM_OPTIONS
        return options.map((opt) => ({
            value: opt.value,
            label: opt.label ?? (opt.labelKey ? t(opt.labelKey) : opt.value),
        }))
    }, [programOptions, t])

    const resolvedCycleLabel = cycleLabel ?? DEFAULT_CYCLE_LABEL
    const resolvedSchoolName = schoolName ?? t('navbar.school.default')
    const buildInitials = (firstName?: string, lastName?: string) => {
        const first = firstName?.trim().charAt(0) ?? ''
        const last = lastName?.trim().charAt(0) ?? ''
        return `${first}${last}`.toUpperCase() || DEFAULT_USER_INITIALS
    }

    const resolvedUserName =
        userName ??
        ((storedUser ? `${storedUser.first_name ?? ''} ${storedUser.last_name ?? ''}`.trim() : '') ||
            t('navbar.user.name'))

    const resolvedUserRole =
        userRole ??
        ((storedUser ? (storedUser.is_admin ? 'admi' : '') : '') ||
            t('navbar.user.role'))

    const resolvedUserInitials =
        userInitials ??
        (storedUser ? buildInitials(storedUser.first_name, storedUser.last_name) : DEFAULT_USER_INITIALS)

    const [selectedProgram, setSelectedProgram] = useState(resolvedProgramType)

    const navStyle: React.CSSProperties = {
        background: '#f8f8f9',
        borderBottom: '1.5px solid #e5e5e8',
        position: 'relative',
    }

    const toggleButton = isSidebarMobile ? (
        <Button
            type="button"
            onClick={toggle}
            aria-label={t('navbar.openMenu')}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
        >
            <Bars3BottomLeftIcon className="h-5 w-5" />
        </Button>
    ) : null

    const PillSwitcher = () => (
        <div
            className="flex items-center gap-[3px] p-[3px] rounded-lg"
            style={{ background: '#ececee', border: '1.5px solid #e0e0e3' }}
        >
            {resolvedProgramOptions.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => setSelectedProgram(opt.value)}
                    className="px-4 py-[6px] rounded-md text-[11.5px] font-bold transition-all duration-200 cursor-pointer border-none tracking-wide"
                    style={
                        selectedProgram === opt.value
                            ? {
                                background: '#fff',
                                color: '#C8102E',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                                border: '1px solid rgba(200,16,46,0.15)',
                            }
                            : { background: 'transparent', color: '#a1a1aa', border: '1px solid transparent' }
                    }
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )

    const SchoolBlock = ({ vertical = false }: { vertical?: boolean }) => (
        <div className={`flex gap-[3px] ${vertical ? 'flex-col items-start' : 'flex-row items-baseline'}`}>
        <span
            className="text-[13px] font-black uppercase leading-none"
            style={{color: '#C8102E', letterSpacing: '0.08em'}}
        >
            {t('navbar.school.label')}:
        </span>
            <span
                className={`font-bold text-zinc-800 leading-none ${vertical ? 'text-[15px]' : 'text-[17px]'}`}
                style={{letterSpacing: '-0.01em'}}
            >
            {resolvedSchoolName}
        </span>
        </div>
    )

    const CycleBlock = () => (
        <div
            className="flex flex-col gap-[2px] px-3 py-2 rounded-lg"
            style={{background: '#fff', border: '1.5px solid #e2e2e6' }}
        >
            <span
                className="text-[9px] font-bold uppercase leading-none text-zinc-400"
                style={{ letterSpacing: '0.12em' }}
            >
                {t('navbar.cycle.label')}
            </span>
            <span className="text-[13px] font-bold text-zinc-600 leading-none tabular-nums">
                {resolvedCycleLabel}
            </span>
        </div>
    )

    const UserBlock = ({ compact = false }: { compact?: boolean }) => (
        <div
            className="flex items-center gap-2.5 cursor-pointer rounded-xl transition-colors hover:bg-zinc-100"
            style={{ padding: '5px 10px 5px 5px' }}
        >
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0"
                style={{ background: '#C8102E' }}
            >
                {resolvedUserInitials}
            </div>
            {!compact && (
                <div className="flex flex-col leading-none gap-[3px]">
                    <span className="text-[12.5px] font-bold text-zinc-800 truncate max-w-[160px]">
                        {resolvedUserName}
                    </span>
                    {resolvedUserRole ? (
                        <span className="text-[10px] text-zinc-400 truncate max-w-[160px]">
                            {resolvedUserRole}
                        </span>
                    ) : null}
                </div>
            )}
        </div>
    )

    const Sep = () => <div className="w-px h-7 bg-zinc-200 flex-shrink-0" />

    /* ─── Mobile ─── */
    if (isMobile) {
        return (
            <nav className="w-full sticky top-0 z-30 flex flex-col gap-2.5 px-4 py-3" style={navStyle}>
                <div className="flex items-center justify-between">
                    <div>{toggleButton}</div>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        <div className="w-px h-6 bg-zinc-200" />
                        <UserBlock />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SchoolBlock vertical />   {/* 👈 */}
                    <div className="w-px h-7 bg-zinc-200 flex-shrink-0" />
                    <CycleBlock />
                    <div className="w-px h-7 bg-zinc-200 flex-shrink-0" />
                    <PillSwitcher />
                </div>
            </nav>
        )
    }

    /* ─── Tablet ─── */
    if (isTablet) {
        return (
            <nav className="w-full h-[72px] flex items-center justify-between px-5 sticky top-0 z-30" style={navStyle}>
                <div className="flex items-center gap-4">
                    {toggleButton}
                    <SchoolBlock />
                </div>
                <div className="flex items-center gap-4 ml-auto">
                    <CycleBlock />
                    <Sep />
                    <PillSwitcher />
                    <Sep />
                    <LanguageSwitcher />
                    <Sep />
                    <UserBlock compact />
                </div>
            </nav>
        )
    }

    /* ─── Desktop ─── */
    return (
        <nav className="w-full h-[72px] flex items-center justify-between px-6 sticky top-0 z-30" style={navStyle}>
            <div className="flex items-center gap-4">
                {toggleButton}
                <SchoolBlock />
            </div>
            <div className="flex items-center gap-5 ml-auto">
                <CycleBlock />
                <Sep />
                <PillSwitcher />
                <Sep />
                <LanguageSwitcher />
                <Sep />
                <UserBlock />
            </div>
        </nav>
    )
}

export { Navbar }