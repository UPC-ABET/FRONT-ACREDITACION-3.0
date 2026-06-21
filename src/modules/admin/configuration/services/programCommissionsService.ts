import { apiDelete, apiGet, apiPost, getApiData } from '@/shared/lib/apiClient';
import type { AssociateProgramCommissionPayload, ProgramCommissionAssociation } from '../types';

const BASE = '/configuration/program-commissions';

export async function listProgramCommissions(): Promise<ProgramCommissionAssociation[]> {
	return getApiData<ProgramCommissionAssociation[]>(await apiGet(BASE));
}

export async function associateProgramCommission(
	payload: AssociateProgramCommissionPayload,
): Promise<ProgramCommissionAssociation> {
	return getApiData<ProgramCommissionAssociation>(await apiPost(BASE, payload));
}

export async function unassociateProgramCommission(id: number): Promise<{ success: boolean }> {
	return getApiData<{ success: boolean }>(await apiDelete(`${BASE}/${id}`));
}
