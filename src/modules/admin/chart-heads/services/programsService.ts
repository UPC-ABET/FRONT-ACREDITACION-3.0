import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { ProgramOption, RawProgram } from '../types';
import { resolveName } from './resolveName';

export async function getAllPrograms(): Promise<ProgramOption[]> {
	const rows = getApiData<RawProgram[]>(await apiGet('/programs/get-all'));
	return rows.map((row) => ({
		id: Number(row.id),
		code: row.code,
		name: resolveName(row.name),
	}));
}
