'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { ChevronRightIcon, Bars3BottomLeftIcon } from '@heroicons/react/24/outline'
import { useScreen } from '@/shared/hooks'
import { useI18n } from '@/providers'
import {Button
} from '@/shared/components'

// ── TYPES
type SidebarContextType = {
    open: boolean
    setOpen: (v: boolean) => void
    toggle: () => void
    isMobile: boolean
}

// ── CONTEXT
const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({
                                    children,
                                    defaultOpen = true,
                                }: {
    children: React.ReactNode
    defaultOpen?: boolean
}) {
    const { isMobile } = useScreen()
    const [open, setOpen] = useState<boolean>(defaultOpen)
    const toggle = () => setOpen(v => !v)

    useEffect(() => {
        if (isMobile) setOpen(false)
    }, [isMobile])

    return (
        <SidebarContext.Provider value={{ open, setOpen, toggle, isMobile }}>
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const ctx = useContext(SidebarContext)
    if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
    return ctx
}

// ── SIDEBAR ROOT
function Sidebar({
                     children,
                     className = '',
                     overlay = true,
                 }: {
    children?: React.ReactNode
    className?: string
    overlay?: boolean
}) {
    const { open, toggle, isMobile } = useSidebar()

    return (
        <>
            {overlay && open && isMobile && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
                    onClick={toggle}
                />
            )}
            <aside
                className={[
                    'fixed sm:relative z-40 flex flex-col h-screen',
                    'transition-all duration-300 ease-in-out',
                    // Dark zinc-900 background
                    'bg-zinc-900',
                    // Subtle right border
                    'border-r border-zinc-800',
                    isMobile
                        ? open ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'
                        : open ? 'w-64' : 'w-[68px]',
                    className,
                ].join(' ')}
                style={{
                    boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
                }}
            >
                {/* Top red accent stripe — thicker, glowing */}
                <div
                    className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{
                        background: 'linear-gradient(90deg, #C8102E 0%, #FF2D4E 60%, #C8102E 100%)',
                        boxShadow: '0 0 12px rgba(200,16,46,0.7)',
                    }}
                />

                {/* Subtle noise/texture overlay for depth */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.025]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                        backgroundSize: '128px 128px',
                    }}
                />

                {children}
            </aside>
        </>
    )
}

export { Sidebar }

// ── HEADER
export function SidebarHeader({ className = '' }: { className?: string }) {
    const { open, toggle } = useSidebar()
    const { t } = useI18n()

    return (
        <div
            className={[
                'relative w-full border-b border-zinc-700 flex items-center justify-center',
                open ? 'h-28 py-3 px-4' : 'h-20 px-2 py-2',
                'transition-all duration-300',
                className,
            ].join(' ')}
        >
            {/* Faint red glow behind logo area */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at 50% 120%, rgba(200,16,46,0.12) 0%, transparent 70%)',
                }}
            />

            {/* Logo / Toggle cuando esta contraido */}
            {open ? (
                <img
                    src="/assets/ABETLogo.png"
                    alt={t('sidebar.logoAlt')}
                    className={[
                        'w-full h-full transition-all duration-300 relative z-10',
                        'object-contain scale-100',
                    ].join(' ')}
                    style={{ filter: 'brightness(0) invert(1)' }}
                />
            ) : (
                <button
                    onClick={toggle}
                    aria-label={t('sidebar.open')}
                    className="relative z-10 h-10 w-10 rounded-lg flex items-center justify-center text-zinc-200 hover:text-white hover:bg-zinc-700/60 transition-all"
                >
                    <Bars3BottomLeftIcon className="h-5 w-5 transition-transform duration-200 rotate-0" />
                </button>
            )}

            {/* Toggle button (solo cuando esta abierto) */}
            {open && (
                <Button variant="ghost" size="icon"
                    onClick={toggle}
                    aria-label={t('sidebar.close')}
                    className={[
                        'absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-20',
                        'text-zinc-100 hover:text-white',
                        'hover:bg-zinc-700/60',
                        'right-3',
                    ].join(' ')}
                >
                    <Bars3BottomLeftIcon
                        className="h-[18px] w-[18px] transition-transform duration-200 rotate-180"
                    />
                </Button>
            )}
        </div>
    )
}

// ── CONTENT
export function SidebarContent({
                                   children,
                                   className = '',
                               }: {
    children?: React.ReactNode
    className?: string
}) {
    return (
        <div className={`flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-0.5 scrollbar-none ${className}`}>
            {children}
        </div>
    )
}

// ── FOOTER
export function SidebarFooter({
                                  children,
                                  className = '',
                              }: {
    children?: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={`px-2.5 py-3 border-t border-zinc-700 ${className}`}
            style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
            }}
        >
            {children}
        </div>
    )
}

// ── GROUP
export function SidebarGroup({
                                 label,
                                 children,
                                 className = '',
                             }: {
    label?: string
    children?: React.ReactNode
    className?: string
}) {
    const { open } = useSidebar()

    return (
        <div className={`mt-1 ${className}`}>
            {label && open && (
                <div className="flex items-center gap-2 px-2.5 mb-2 mt-1">
                    {/* Small red dash before label */}
                    <div className="w-3 h-px bg-[#C8102E] opacity-80 flex-shrink-0" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                        {label}
                    </p>
                </div>
            )}
            <div className="flex flex-col gap-0.5">{children}</div>
        </div>
    )
}

// ── ITEM
export function SidebarItem({
                                icon,
                                label,
                                sublabel,
                                badge,
                                badgeVariant = 'neutral',
                                active = false,
                                onClick,
                                className = '',
                            }: {
    icon?: React.ReactNode
    label: string
    sublabel?: string
    badge?: string | number
    badgeVariant?: 'urgent' | 'info' | 'neutral'
    active?: boolean
    onClick?: () => void
    className?: string
}) {
    const { open } = useSidebar()
    const hasIcon = icon !== null && icon !== undefined

    const badgeStyles = {
        urgent:  'bg-red-900/60 text-red-300 border border-red-700/50',
        info:    'bg-blue-900/60 text-blue-300 border border-blue-700/50',
        neutral: 'bg-zinc-700/60 text-zinc-300 border border-zinc-600/50',
    }

    return (
        <div
            onClick={onClick}
            title={!open ? label : undefined}
            className={[
                'relative flex items-center px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 group',
                hasIcon ? 'gap-3' : 'gap-0',
                active ? '' : 'hover:bg-zinc-800/70',
                className,
            ].join(' ')}
            style={active ? {
                // ROJO SÓLIDO (Hijo Activo - Protagonista)
                background: 'linear-gradient(135deg, rgba(200,16,46,1) 0%, rgba(180,10,36,1) 100%)',
                boxShadow: '0 4px 12px rgba(200,16,46,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
            } : undefined}
        >
            {active && (
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: '#fff' }}
                />
            )}

            {hasIcon && (
                <div
                    className={[
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                        active ? 'bg-white/20' : 'bg-zinc-800 group-hover:bg-zinc-700',
                    ].join(' ')}
                >
                    <span className={active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}>
                        {icon}
                    </span>
                </div>
            )}

            {open && (
                <>
                    <div className="flex flex-col flex-1 min-w-0">
                        <span
                            className={[
                                'text-[13px] font-semibold leading-tight whitespace-normal break-words',
                                active ? 'text-white' : 'text-zinc-300 group-hover:text-white',
                            ].join(' ')}
                        >
                            {label}
                        </span>
                        {sublabel && (
                            <span
                                className={[
                                    'text-[10.5px] whitespace-normal break-words',
                                    active ? 'text-white/80' : 'text-zinc-500',
                                ].join(' ')}
                            >
                                {sublabel}
                            </span>
                        )}
                    </div>
                    {badge !== undefined && (
                        <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                active
                                    ? 'bg-white/20 text-white border border-white/25'
                                    : badgeStyles[badgeVariant]
                            }`}
                        >
                            {badge}
                        </span>
                    )}
                </>
            )}
        </div>
    )
}

// ── NAV GROUP (collapsible)
export function SidebarNavGroup({
                                    label,
                                    icon,
                                    badge,
                                    badgeVariant = 'neutral',
                                    defaultOpen = true,
                                    active = false, // Este 'active' indica que un hijo está seleccionado
                                    children,
                                }: {
    label: string
    icon: React.ReactNode
    badge?: string | number
    badgeVariant?: 'urgent' | 'info' | 'neutral'
    defaultOpen?: boolean
    active?: boolean
    children?: React.ReactNode
}) {
    const { open } = useSidebar()
    const [expanded, setExpanded] = useState(defaultOpen)

    const badgeStyles = {
        urgent:  'bg-red-900/60 text-red-300 border border-red-700/50',
        info:    'bg-blue-900/60 text-blue-300 border border-blue-700/50',
        neutral: 'bg-zinc-700/60 text-zinc-300 border border-zinc-600/50',
    }

    return (
        <div>
            <div
                onClick={() => { if (open) setExpanded(p => !p) }}
                className={[
                    'relative flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-150 group',
                    // Si está activo, aplicamos un fondo rojo sutil (Opción A)
                    active ? 'bg-red-500/10' : 'hover:bg-zinc-800/70',
                ].join(' ')}
            >
                {/* Indicador lateral sutil para el padre */}
                {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-red-600 rounded-r-full" />
                )}

                <div
                    className={[
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',
                        active ? 'bg-red-500/20' : 'bg-zinc-800 group-hover:bg-zinc-700',
                    ].join(' ')}
                >
                    <span className={active ? 'text-red-500' : 'text-zinc-400 group-hover:text-zinc-200'}>
                        {icon}
                    </span>
                </div>

                {open && (
                    <>
                        <span className={['text-[13px] font-semibold flex-1 truncate', active ? 'text-white' : 'text-zinc-300 group-hover:text-white'].join(' ')}
                        >
                            {label}
                        </span>
                        {badge !== undefined && (
                            <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    active
                                        ? 'bg-white/20 text-white border border-white/25'
                                        : badgeStyles[badgeVariant]
                                }`}
                            >
                                {badge}
                            </span>
                        )}
                        <ChevronRightIcon
                            className={[
                                'h-3.5 w-3.5 transition-transform duration-200 flex-shrink-0',
                                expanded ? 'rotate-90' : '',
                                active ? 'text-red-500' : 'text-zinc-600',
                            ].join(' ')}
                        />
                    </>
                )}
            </div>

            {open && (
                <div
                    className={[
                        'ml-5 pl-3 flex flex-col gap-0.5 overflow-hidden transition-all duration-200',
                        expanded ? 'max-h-[500px] mt-0.5 mb-1' : 'max-h-0',
                    ].join(' ')}
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.2)' }}
                >
                    {children}
                </div>
            )}
        </div>
    )
}

// ── DIVIDER
export function SidebarDivider() {
    return (
        <div className="my-2 mx-2 flex items-center gap-2">
            <div className="flex-1 h-px bg-zinc-400" />
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <div className="flex-1 h-px bg-zinc-400" />
        </div>
    )
}
