'use client';

import { useSyncExternalStore } from 'react';

// Aligned with Tailwind: sm=640, lg=1024
const BREAKPOINTS = {
	mobile: '(max-width: 639px)',
	tablet: '(min-width: 640px) and (max-width: 1023px)',
	desktop: '(min-width: 1024px)',
} as const;

type ScreenType = 'mobile' | 'tablet' | 'desktop';

function getScreen(): ScreenType {
	if (typeof window === 'undefined') return 'desktop';
	if (window.matchMedia(BREAKPOINTS.mobile).matches) return 'mobile';
	if (window.matchMedia(BREAKPOINTS.tablet).matches) return 'tablet';
	return 'desktop';
}

function subscribe(onChange: () => void): () => void {
	const queries = Object.values(BREAKPOINTS).map((query) => window.matchMedia(query));
	queries.forEach((mql) => mql.addEventListener('change', onChange));
	return () => queries.forEach((mql) => mql.removeEventListener('change', onChange));
}

export function useScreen() {
	const screen = useSyncExternalStore(subscribe, getScreen, () => 'desktop' as ScreenType);

	return {
		screen,
		isMobile: screen === 'mobile',
		isTablet: screen === 'tablet',
		isDesktop: screen === 'desktop',
	};
}
