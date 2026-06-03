import { apiGet, apiPost, getApiData } from '@/shared/lib/apiClient';
import type { ChartHeadsConfig, ConfigureChartHeadsPayload } from '../types';

const BASE = '/admin-chart-heads';

export async function getChartHeadsConfig(academicPeriodId: number): Promise<ChartHeadsConfig> {
	return getApiData<ChartHeadsConfig>(await apiGet(`${BASE}/${academicPeriodId}`));
}

export async function configureChartHeads(
	payload: ConfigureChartHeadsPayload,
): Promise<ChartHeadsConfig> {
	return getApiData<ChartHeadsConfig>(await apiPost(`${BASE}/configure`, payload));
}
