'use client'

import { useEffect, useState } from 'react'

// Aligned with Tailwind: sm=640, lg=1024
const BREAKPOINTS = {
    mobile: '(max-width: 639px)',
    tablet: '(min-width: 640px) and (max-width: 1023px)',
    desktop: '(min-width: 1024px)',
} as const

type ScreenType = 'mobile' | 'tablet' | 'desktop'

function getScreen(): ScreenType {
    if (typeof window === 'undefined') return 'desktop'
    if (window.matchMedia(BREAKPOINTS.mobile).matches) return 'mobile'
    if (window.matchMedia(BREAKPOINTS.tablet).matches) return 'tablet'
    return 'desktop'
}

export function useScreen() {
    const [screen, setScreen] = useState<ScreenType>('desktop')

    useEffect(() => {
        setScreen(getScreen())

        const queries = (Object.entries(BREAKPOINTS) as [ScreenType, string][]).map(
            ([type, query]) => {
                const mql = window.matchMedia(query)
                const handler = (e: MediaQueryListEvent) => {
                    if (e.matches) setScreen(type)
                }
                mql.addEventListener('change', handler)
                return { mql, handler }
            }
        )

        return () => {
            queries.forEach(({ mql, handler }) => mql.removeEventListener('change', handler))
        }
    }, [])

    return {
        screen,
        isMobile:  screen === 'mobile',
        isTablet:  screen === 'tablet',
        isDesktop: screen === 'desktop',
    }
}