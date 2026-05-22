'use client';

import { useEffect, useState } from 'react';
import { authHeader } from '@/shared/lib';

const PARAMETER_CODE = 'PARAMETER_LANGUAGES';
const FALLBACK: string[] = ['es', 'en'];

let cached: string[] | null = null;
let inFlight: Promise<string[]> | null = null;

async function fetchLanguages(): Promise<string[]> {
	const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
	if (!baseUrl) return FALLBACK;

	const res = await fetch(`${baseUrl}/parameters/get-by-filters`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', accept: '*/*', ...authHeader() },
		body: JSON.stringify({ code: PARAMETER_CODE }),
	});

	const body = (await res.json().catch(() => null)) as
		| { data?: Array<{ value?: unknown }> }
		| null;
	const value = body?.data?.[0]?.value;
	if (!res.ok || !Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
		return FALLBACK;
	}
	return value as string[];
}

function loadLanguages(): Promise<string[]> {
	if (cached) return Promise.resolve(cached);
	if (!inFlight) {
		inFlight = fetchLanguages()
			.then((v) => {
				cached = v;
				inFlight = null;
				return v;
			})
			.catch(() => {
				cached = FALLBACK;
				inFlight = null;
				return FALLBACK;
			});
	}
	return inFlight;
}

export function useLanguages(): string[] {
	const [languages, setLanguages] = useState<string[]>(() => cached ?? FALLBACK);

	useEffect(() => {
		if (cached) return;
		let alive = true;
		void loadLanguages().then((v) => {
			if (alive) setLanguages(v);
		});
		return () => {
			alive = false;
		};
	}, []);

	return languages;
}
