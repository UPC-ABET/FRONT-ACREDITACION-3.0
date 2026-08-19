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
	IFCStatusHistoryEntry,
	IFCStatusHistoryResponse,
	IFCViewPayload,
	PatchIFCBody,
	RejectIFCBody,
	SubmitResult,
} from '../types';
import { ApiResponse } from '@/shared';

export async function listIFCs(chartIds: number[]): Promise<IFCRow[]> {
	const envelope = await apiPost<ApiResponse<IFCRow[]>>('/ifcs/list', {
		chartIds: chartIds.map(Number),
	});
	if (!envelope?.data) throw new ApiError('ifcs.error.generic');
	return envelope.data;
}

export async function getIFCView(id: number): Promise<IFCViewPayload> {
	const envelope = await apiGet<ApiResponse<unknown>>(`/ifcs/get-by-id/${id}`);
	if (!envelope?.data) throw new ApiError('ifcs.error.viewFailed');
	return ifcViewPayloadSchema.parse(envelope.data);
}

export async function submitIFC(id: number): Promise<SubmitResult> {
	const envelope = await apiPost<ApiResponse<unknown>>(`/ifcs/${id}/submit`);
	if (!envelope?.data) throw new ApiError('ifcs.error.submitFailed');
	return submitResultSchema.parse(envelope.data) as SubmitResult;
}

export async function approveIFC(id: number): Promise<void> {
	await apiPost(`/ifcs/${id}/approve`);
}

export async function rejectIFC(id: number, comment: RejectIFCBody['comment']): Promise<void> {
	await apiPost(`/ifcs/${id}/reject`, { comment });
}

// No zod guard here, unlike getIFCView/getIFCPrefill: every field is already a plain
// string or a nullable I18nText, with no id to coerce and no optional field needing a
// default, so a runtime schema would duplicate what the type already guarantees.
export async function getIFCStatusHistory(id: number): Promise<IFCStatusHistoryEntry[]> {
	const envelope = await apiGet<ApiResponse<IFCStatusHistoryResponse>>(
		`/ifcs/${id}/status-history`,
	);
	if (!envelope?.data) throw new ApiError('ifcs.error.statusHistoryFailed');
	return envelope.data.statuses;
}

export async function getIFCPrefill(chartId: number): Promise<IFCPrefill> {
	const envelope = await apiGet<ApiResponse<IFCPrefill>>(`/ifcs/prefill?chartId=${chartId}`);
	if (!envelope?.data) throw new ApiError('ifcs.error.prefillFailed');
	envelope.data.previousActions = previousActionsSchema.parse(envelope.data.previousActions);
	return envelope.data;
}

function parseSaveResult(data: unknown): SubmitResult {
	return submitResultSchema.parse(data) as SubmitResult;
}

export async function createIFC(payload: CreateIFCBody): Promise<SubmitResult> {
	const envelope = await apiPost<ApiResponse<unknown>>('/ifcs/create', payload);
	if (!envelope?.data) throw new ApiError('ifcs.error.createFailed');
	return parseSaveResult(envelope.data);
}

export async function patchIFC(id: number, payload: PatchIFCBody): Promise<SubmitResult> {
	const envelope = await apiPatch<ApiResponse<unknown>>(`/ifcs/${id}`, payload);
	if (!envelope?.data) throw new ApiError('ifcs.error.patchFailed');
	return parseSaveResult(envelope.data);
}
