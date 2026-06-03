import { apiGet, apiPatch, apiPost, ApiError } from '@/shared/lib';
import {
	ifcViewPayloadSchema,
	previousActionsSchema,
	submitResultSchema,
} from '../schemas/ifcResponseSchemas';
import type {
	CreateIFCBody,
	IFCPrefill,
	IFCRow,
	IFCViewPayload,
	PatchIFCBody,
	RejectIFCBody,
	SubmitResult,
} from '../types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function listIFCs(chartIds: number[]): Promise<IFCRow[]> {
	const envelope = await apiPost<Envelope<IFCRow[]>>('/ifcs/list', {
		chartIds: chartIds.map(Number),
	});
	if (!envelope?.data) throw new ApiError('ifcs.error.generic');
	return envelope.data;
}

export async function getIFCView(id: number): Promise<IFCViewPayload> {
	const envelope = await apiGet<Envelope<unknown>>(`/ifcs/get-by-id/${id}`);
	if (!envelope?.data) throw new ApiError('ifcs.error.viewFailed');
	return ifcViewPayloadSchema.parse(envelope.data) as unknown as IFCViewPayload;
}

export async function submitIFC(id: number): Promise<SubmitResult> {
	const envelope = await apiPost<Envelope<unknown>>(`/ifcs/${id}/submit`);
	if (!envelope?.data) throw new ApiError('ifcs.error.submitFailed');
	return submitResultSchema.parse(envelope.data) as unknown as SubmitResult;
}

export async function approveIFC(id: number): Promise<void> {
	await apiPost(`/ifcs/${id}/approve`);
}

export async function rejectIFC(id: number, comment: RejectIFCBody['comment']): Promise<void> {
	await apiPost(`/ifcs/${id}/reject`, { comment });
}

export async function getIFCPrefill(chartId: number, periodId: number): Promise<IFCPrefill> {
	const envelope = await apiGet<Envelope<IFCPrefill>>(
		`/ifcs/prefill?chartId=${chartId}&periodId=${periodId}`,
	);
	if (!envelope?.data) throw new ApiError('ifcs.error.prefillFailed');
	envelope.data.previousActions = previousActionsSchema.parse(
		envelope.data.previousActions,
	) as unknown as IFCPrefill['previousActions'];
	return envelope.data;
}

function parseSaveResult(data: unknown): SubmitResult {
	return submitResultSchema.parse(data) as unknown as SubmitResult;
}

export async function createIFC(payload: CreateIFCBody): Promise<SubmitResult> {
	const envelope = await apiPost<Envelope<unknown>>('/ifcs/create', payload);
	if (!envelope?.data) throw new ApiError('ifcs.error.createFailed');
	return parseSaveResult(envelope.data);
}

export async function patchIFC(id: number, payload: PatchIFCBody): Promise<SubmitResult> {
	const envelope = await apiPatch<Envelope<unknown>>(`/ifcs/${id}`, payload);
	if (!envelope?.data) throw new ApiError('ifcs.error.patchFailed');
	return parseSaveResult(envelope.data);
}
