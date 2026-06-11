import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { UserOption } from '../types';

interface RawUser {
	id: number | string;
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
}

function buildLabel(user: RawUser): string {
	const fullName = user.name ?? [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
	if (fullName && user.email) return `${fullName} — ${user.email}`;
	return fullName || user.email || String(user.id);
}

export async function getAllUsers(): Promise<UserOption[]> {
	const rows = getApiData<RawUser[]>(await apiGet('/users/get-all'));
	return rows.map((row) => ({
		id: Number(row.id),
		label: buildLabel(row),
	}));
}
