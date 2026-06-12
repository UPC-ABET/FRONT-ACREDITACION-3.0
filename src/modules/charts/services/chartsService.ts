import { apiDelete, apiGet, apiPost, apiPut, getApiData } from '@/shared/lib';
import type {
	ChartCreatePayload,
	ChartNode,
	ChartUpdatePayload,
	CourseLookupItem,
	PaginatedResult,
	ProgramItem,
	StaffLookupItem,
} from '../types';

const BASE = '/charts/maintenance';

type LookupParams = { search?: string; page?: number; pageSize?: number };

function buildLookupQuery(params: LookupParams): string {
	const query = new URLSearchParams();
	if (params.search) query.set('search', params.search);
	if (params.page != null) query.set('page', String(params.page));
	if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
	const queryString = query.toString();
	return queryString ? `?${queryString}` : '';
}

export const chartsService = {
	async tree(): Promise<ChartNode | null> {
		return getApiData<ChartNode | null>(await apiGet(`${BASE}/tree`));
	},

	async create(payload: ChartCreatePayload): Promise<ChartNode> {
		return getApiData<ChartNode>(await apiPost(`${BASE}/create`, payload));
	},

	async update(chartId: number, payload: ChartUpdatePayload): Promise<ChartNode> {
		return getApiData<ChartNode>(await apiPut(`${BASE}/update/${chartId}`, payload));
	},

	async remove(chartId: number): Promise<void> {
		await apiDelete(`${BASE}/${chartId}`);
	},

	async staffLookup(params: LookupParams): Promise<PaginatedResult<StaffLookupItem>> {
		return getApiData<PaginatedResult<StaffLookupItem>>(
			await apiGet(`/staff/lookup${buildLookupQuery(params)}`),
		);
	},

	async courseLookup(params: LookupParams): Promise<PaginatedResult<CourseLookupItem>> {
		return getApiData<PaginatedResult<CourseLookupItem>>(
			await apiGet(`/courses/lookup${buildLookupQuery(params)}`),
		);
	},

	async programsGetAll(): Promise<ProgramItem[]> {
		return getApiData<ProgramItem[]>(await apiGet('/programs/get-all'));
	},
};
