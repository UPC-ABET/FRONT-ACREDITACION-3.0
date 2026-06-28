'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type GlobalAcademicFilterKey = 'school' | 'modality' | 'period';

export type GlobalAcademicFiltersVisibility = Record<GlobalAcademicFilterKey, boolean>;

export type GlobalAcademicFiltersLock = Record<GlobalAcademicFilterKey, boolean>;

const DEFAULT_GLOBAL_ACADEMIC_FILTERS_VISIBILITY: GlobalAcademicFiltersVisibility = {
	school: true,
	modality: true,
	period: true,
};

const DEFAULT_GLOBAL_ACADEMIC_FILTERS_LOCK: GlobalAcademicFiltersLock = {
	school: false,
	modality: false,
	period: false,
};

type GlobalAcademicFiltersVisibilityContextValue = {
	visibility: GlobalAcademicFiltersVisibility;
	setVisibility: (visibility: GlobalAcademicFiltersVisibility) => void;
	lock: GlobalAcademicFiltersLock;
	setLock: (lock: GlobalAcademicFiltersLock) => void;
};

const GlobalAcademicFiltersVisibilityContext =
	createContext<GlobalAcademicFiltersVisibilityContextValue | null>(null);

export function GlobalFiltersVisibilityProvider({ children }: { children: React.ReactNode }) {
	const [visibility, setVisibility] = useState<GlobalAcademicFiltersVisibility>(
		DEFAULT_GLOBAL_ACADEMIC_FILTERS_VISIBILITY,
	);
	const [lock, setLock] = useState<GlobalAcademicFiltersLock>(DEFAULT_GLOBAL_ACADEMIC_FILTERS_LOCK);

	const value = useMemo<GlobalAcademicFiltersVisibilityContextValue>(
		() => ({ visibility, setVisibility, lock, setLock }),
		[visibility, lock],
	);

	return (
		<GlobalAcademicFiltersVisibilityContext.Provider value={value}>
			{children}
		</GlobalAcademicFiltersVisibilityContext.Provider>
	);
}

function useGlobalAcademicFiltersVisibilityContext(): GlobalAcademicFiltersVisibilityContextValue {
	const context = useContext(GlobalAcademicFiltersVisibilityContext);
	if (!context) {
		throw new Error(
			'useGlobalAcademicFiltersVisibility must be used within GlobalFiltersVisibilityProvider',
		);
	}
	return context;
}

export function useGlobalAcademicFiltersVisibility(): GlobalAcademicFiltersVisibility {
	return useGlobalAcademicFiltersVisibilityContext().visibility;
}

export function useGlobalAcademicFiltersVisibilityOverride(
	visibility: Partial<GlobalAcademicFiltersVisibility>,
): void {
	const { setVisibility } = useGlobalAcademicFiltersVisibilityContext();
	const { school, modality, period } = visibility;

	useEffect(() => {
		setVisibility({
			...DEFAULT_GLOBAL_ACADEMIC_FILTERS_VISIBILITY,
			...(school === undefined ? {} : { school }),
			...(modality === undefined ? {} : { modality }),
			...(period === undefined ? {} : { period }),
		});

		return () => setVisibility(DEFAULT_GLOBAL_ACADEMIC_FILTERS_VISIBILITY);
	}, [modality, period, school, setVisibility]);
}

export function useGlobalAcademicFiltersLock(): GlobalAcademicFiltersLock {
	return useGlobalAcademicFiltersVisibilityContext().lock;
}

export function useGlobalAcademicFiltersLockOverride(
	lock: Partial<GlobalAcademicFiltersLock>,
): void {
	const { setLock } = useGlobalAcademicFiltersVisibilityContext();
	const { school, modality, period } = lock;

	useEffect(() => {
		setLock({
			...DEFAULT_GLOBAL_ACADEMIC_FILTERS_LOCK,
			...(school === undefined ? {} : { school }),
			...(modality === undefined ? {} : { modality }),
			...(period === undefined ? {} : { period }),
		});

		return () => setLock(DEFAULT_GLOBAL_ACADEMIC_FILTERS_LOCK);
	}, [modality, period, school, setLock]);
}
