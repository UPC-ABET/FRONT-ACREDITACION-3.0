'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type FiltersVisibility = {
	school: boolean;
	modality: boolean;
	period: boolean;
};

const DEFAULT_VISIBILITY: FiltersVisibility = { school: true, modality: true, period: true };

interface VisibilityContextValue {
	visibility: FiltersVisibility;
	setVisibility: (v: FiltersVisibility) => void;
}

const VisibilityContext = createContext<VisibilityContextValue>({
	visibility: DEFAULT_VISIBILITY,
	setVisibility: () => {},
});

export function GlobalAcademicFiltersVisibilityProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [visibility, setVisibility] = useState<FiltersVisibility>(DEFAULT_VISIBILITY);
	const value = useMemo<VisibilityContextValue>(
		() => ({ visibility, setVisibility }),
		[visibility],
	);
	return <VisibilityContext.Provider value={value}>{children}</VisibilityContext.Provider>;
}

export function useGlobalAcademicFiltersVisibility(): FiltersVisibility {
	return useContext(VisibilityContext).visibility;
}

/** Call inside a page/component to override which global academic filters are visible.
 *  The override is reset automatically when the component unmounts.
 *
 *  @example
 *  useGlobalAcademicFiltersVisibilityOverride({ school: false, modality: true, period: true });
 */
export function useGlobalAcademicFiltersVisibilityOverride(override: FiltersVisibility): void {
	const { setVisibility } = useContext(VisibilityContext);
	const overrideRef = useRef(override);

	useEffect(() => {
		overrideRef.current = override;
	});

	useEffect(() => {
		setVisibility(overrideRef.current);
		return () => setVisibility(DEFAULT_VISIBILITY);
	}, [setVisibility]);
}
