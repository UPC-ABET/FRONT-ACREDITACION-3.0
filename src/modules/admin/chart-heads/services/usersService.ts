import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { UserOption } from '../types';

interface RawLinkedStaff {
	id: number;
	code?: string | null;
	firstName?: string;
	lastName?: string;
}

interface RawUser {
	id: number | string;
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	staff?: RawLinkedStaff | null;
}

function buildLabel(user: RawUser): string {
	const fullName = user.name ?? [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
	if (fullName && user.email) return `${fullName} — ${user.email}`;
	return fullName || user.email || String(user.id);
}

export async function getAllUsers(): Promise<UserOption[]> {
	const rows = getApiData<RawUser[]>(await apiGet('/users/get-all?unlinkedOnly=true'));
	return rows.map((row) => ({
		id: Number(row.id),
		firstName: row.firstName ?? '',
		lastName: row.lastName ?? '',
		email: row.email,
		staff: row.staff
			? {
					id: row.staff.id,
					code: row.staff.code ?? null,
					firstName: row.staff.firstName ?? '',
					lastName: row.staff.lastName ?? '',
				}
			: null,
		label: buildLabel(row),
	}));
}
