'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface UseTabParamOptions {
	paramName?: string;
	clearParams?: string[];
}

export function useTabParam(
	defaultTab: string,
	{ paramName = 'tab', clearParams = [] }: UseTabParamOptions = {},
): [string, (id: string) => void] {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const activeTab = searchParams.get(paramName) ?? defaultTab;

	const setTab = useCallback(
		(id: string) => {
			const next = new URLSearchParams(searchParams.toString());
			next.set(paramName, id);
			clearParams.forEach((param) => next.delete(param));
			router.replace(`${pathname}?${next.toString()}`);
		},
		[router, pathname, searchParams, paramName, clearParams],
	);

	return [activeTab, setTab];
}
