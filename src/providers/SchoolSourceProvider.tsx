'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { SchoolSource } from '@/shared/types';

interface SchoolSourceContextValue {
	source: SchoolSource | null;
	setSource: (source: SchoolSource | null) => void;
}

const SchoolSourceContext = createContext<SchoolSourceContextValue | null>(null);

export function SchoolSourceProvider({ children }: { children: React.ReactNode }) {
	const [source, setSource] = useState<SchoolSource | null>(null);
	const value = useMemo<SchoolSourceContextValue>(() => ({ source, setSource }), [source]);
	return <SchoolSourceContext.Provider value={value}>{children}</SchoolSourceContext.Provider>;
}

function useSchoolSourceContext(): SchoolSourceContextValue {
	const ctx = useContext(SchoolSourceContext);
	if (!ctx) throw new Error('useSchoolSource must be used within SchoolSourceProvider');
	return ctx;
}

export function useSchoolSource(): SchoolSource | null {
	return useSchoolSourceContext().source;
}

export function useSchoolSourceOverride(source: SchoolSource): void {
	const { setSource } = useSchoolSourceContext();
	const fetchRef = useRef(source.fetch);

	useEffect(() => {
		fetchRef.current = source.fetch;
	});

	useEffect(() => {
		setSource({ key: source.key, fetch: () => fetchRef.current() });
		return () => setSource(null);
	}, [source.key, setSource]);
}
