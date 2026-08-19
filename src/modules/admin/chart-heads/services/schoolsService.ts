import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { RawSchool, SchoolOption } from '../types';
import { resolveName } from './resolveName';

export async function getAllSchools(): Promise<SchoolOption[]> {
	const rows = getApiData<RawSchool[]>(await apiGet('/schools/get-all'));
	return rows.map((row) => ({
		id: Number(row.id),
		code: row.code,
		name: resolveName(row.name),
	}));
}
