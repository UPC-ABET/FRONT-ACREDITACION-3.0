import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { I18nText } from '@/shared/types';
import type { SchoolOption } from '../types';

interface RawSchool {
	id: number | string;
	code: string;
	name: string | I18nText;
}

function resolveName(name: string | I18nText): string {
	if (typeof name === 'string') return name;
	return name.es ?? name.en ?? Object.values(name)[0] ?? '';
}

export async function getAllSchools(): Promise<SchoolOption[]> {
	const rows = getApiData<RawSchool[]>(await apiGet('/schools/get-all'));
	return rows.map((row) => ({
		id: Number(row.id),
		code: row.code,
		name: resolveName(row.name),
	}));
}
