'use client';

import { useQuery } from '@tanstack/react-query';
import { apiPost } from '@/shared/lib';
import { PARAMETER_CODES } from '@/shared/constants';
const FALLBACK: string[] = ['es', 'en'];

type ParameterRow = { value?: unknown };
type ParameterResponse = { data?: ParameterRow[] };

async function fetchLanguages(): Promise<string[]> {
	try {
		const body = await apiPost<ParameterResponse>('/parameters/get-by-filters', {
			code: PARAMETER_CODES.LANGUAGES,
		});
		const value = body?.data?.[0]?.value;
		if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
			return value as string[];
		}
	} catch {
		// fall through to fallback
	}
	return FALLBACK;
}

export const languagesQueryKeys = {
	all: ['languages'] as const,
};

export function useLanguages(): string[] {
	const { data } = useQuery({
		queryKey: languagesQueryKeys.all,
		queryFn: fetchLanguages,
		staleTime: Infinity,
		placeholderData: FALLBACK,
	});

	return data ?? FALLBACK;
}
