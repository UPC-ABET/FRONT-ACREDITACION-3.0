'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type GlobalAcademicFilterKey = 'school' | 'modality' | 'period';

export type GlobalAcademicFiltersVisibility = Record<GlobalAcademicFilterKey, boolean>;

const DEFAULT_GLOBAL_ACADEMIC_FILTERS_VISIBILITY: GlobalAcademicFiltersVisibility = {
	school: true,
	modality: true,
	period: true,
};

type GlobalAcademicFiltersVisibilityContextValue = {
	visibility: GlobalAcademicFiltersVisibility;
	setVisibility: (visibility: GlobalAcademicFiltersVisibility) => void;
};

const GlobalAcademicFiltersVisibilityContext =
	createContext<GlobalAcademicFiltersVisibilityContextValue | null>(null);

export function GlobalFiltersVisibilityProvider({ children }: { children: React.ReactNode }) {
	const [visibility, setVisibility] = useState<GlobalAcademicFiltersVisibility>(
		DEFAULT_GLOBAL_ACADEMIC_FILTERS_VISIBILITY,
	);

	const value = useMemo<GlobalAcademicFiltersVisibilityContextValue>(
		() => ({ visibility, setVisibility }),
		[visibility],
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
