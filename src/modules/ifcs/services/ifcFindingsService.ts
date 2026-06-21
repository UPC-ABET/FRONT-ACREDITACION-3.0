import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '@/shared/lib';
import { ApiResponse } from '@/shared';
import type { FindingDetailPayload, FindingRow, PatchFindingBody } from '../types';

export async function listFindings(chartIds: number[]): Promise<FindingRow[]> {
	const envelope = await apiPost<ApiResponse<FindingRow[]>>('/ifc-findings/list', {
		chartIds: chartIds.map(Number),
	});
	if (!envelope?.data) throw new ApiError('ifcFindings.error.listFailed');

	return envelope.data.map((r) => ({
		...r,
		id: Number(r.id),
		ifcId: Number(r.ifcId),
		courseId: Number(r.courseId),
	}));
}

export async function getFindingDetail(id: number): Promise<FindingDetailPayload> {
	const envelope = await apiGet<ApiResponse<FindingDetailPayload>>(`/ifc-findings/get-by-id/${id}`);
	if (!envelope?.data) throw new ApiError('ifcFindings.error.viewFailed');

	const data = envelope.data;
	data.finding.id = Number(data.finding.id);
	data.actions.forEach((a) => {
		a.id = Number(a.id);
	});
	return data;
}

export async function patchFinding(id: number, payload: PatchFindingBody): Promise<{ id: number }> {
	const envelope = await apiPatch<ApiResponse<{ id: number }>>(`/ifc-findings/${id}`, payload);
	if (!envelope?.data) throw new ApiError('ifcFindings.error.patchFailed');

	return { id: Number(envelope.data.id) };
}

export async function deleteFinding(id: number): Promise<void> {
	await apiDelete(`/ifc-findings/${id}`);
}
