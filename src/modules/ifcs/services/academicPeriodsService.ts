import { authHeader } from '@/shared/lib';
import type { AcademicPeriod } from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function getAllAcademicPeriods(): Promise<AcademicPeriod[]> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');

	const res = await fetch(`${BASE_URL}/academic-periods/get-all`, {
		method: 'GET',
		headers: { accept: '*/*', ...authHeader() },
	});

	const body = (await res.json().catch(() => null)) as Envelope<AcademicPeriod[]> | null;
	if (!res.ok || !body?.data) throw new Error(body?.message ?? 'academicPeriods.error.generic');

	// Newest period first (codes like "202502" sort lexicographically).
	return body.data.slice().sort((a, b) => b.code.localeCompare(a.code));
}
