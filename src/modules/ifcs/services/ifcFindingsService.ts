import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from '@/shared/lib';
import type { FindingDetailPayload, FindingRow, PatchFindingBody } from '../types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function listFindings(chartIds: number[], periodId: number): Promise<FindingRow[]> {
	const envelope = await apiPost<Envelope<FindingRow[]>>('/ifc-findings/list', {
		chart_ids: chartIds.map(Number),
		period_id: Number(periodId),
	});
	if (!envelope?.data) throw new ApiError('ifcFindings.error.listFailed');

	return envelope.data.map((r) => ({
		...r,
		id: Number(r.id),
		ifc_id: Number(r.ifc_id),
		course_id: Number(r.course_id),
	}));
}

export async function getFindingDetail(id: number): Promise<FindingDetailPayload> {
	const envelope = await apiGet<Envelope<FindingDetailPayload>>(`/ifc-findings/get-by-id/${id}`);
	if (!envelope?.data) throw new ApiError('ifcFindings.error.viewFailed');

	const data = envelope.data;
	data.finding.id = Number(data.finding.id);
	data.actions.forEach((a) => {
		a.id = Number(a.id);
	});
	return data;
}

export async function patchFinding(id: number, payload: PatchFindingBody): Promise<{ id: number }> {
	const envelope = await apiPatch<Envelope<{ id: number }>>(`/ifc-findings/${id}`, payload);
	if (!envelope?.data) throw new ApiError('ifcFindings.error.patchFailed');

	return { id: Number(envelope.data.id) };
}

export async function deleteFinding(id: number): Promise<void> {
	await apiDelete(`/ifc-findings/${id}`);
}
