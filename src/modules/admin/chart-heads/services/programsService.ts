import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { I18nText } from '@/shared/types';
import type { ProgramOption, RawProgram } from '../types';

function resolveName(name: string | I18nText): string {
	if (typeof name === 'string') return name;
	return name.es ?? name.en ?? Object.values(name)[0] ?? '';
}

export async function getAllPrograms(): Promise<ProgramOption[]> {
	const rows = getApiData<RawProgram[]>(await apiGet('/programs/get-all'));
	return rows.map((row) => ({
		id: Number(row.id),
		code: row.code,
		name: resolveName(row.name),
	}));
}
