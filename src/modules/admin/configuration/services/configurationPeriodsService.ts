import { apiGet, apiPatch, apiPost, getApiData } from '@/shared/lib/apiClient';
import type { ConfigurationPeriod, CreatePeriodPayload } from '../types';

const BASE = '/configuration/periods';

export async function listPeriods(): Promise<ConfigurationPeriod[]> {
	return getApiData<ConfigurationPeriod[]>(await apiGet(BASE));
}

export async function createPeriod(payload: CreatePeriodPayload): Promise<ConfigurationPeriod> {
	return getApiData<ConfigurationPeriod>(await apiPost(BASE, payload));
}

export async function activatePeriod(id: number): Promise<ConfigurationPeriod> {
	return getApiData<ConfigurationPeriod>(await apiPatch(`${BASE}/${id}/activate`));
}
