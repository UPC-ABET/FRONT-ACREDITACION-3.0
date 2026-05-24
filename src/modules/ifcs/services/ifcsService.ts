import { apiGet, apiPatch, apiPost, ApiError } from '@/shared/lib';
import type {
	CreateIFCBody,
	IFCPrefill,
	IFCRow,
	IFCViewPayload,
	PatchIFCBody,
	RejectIFCBody,
	SubmitResult,
} from './types';

interface Envelope<T> {
	code: number;
	message: string;
	data: T;
}

export async function listIFCs(chartIds: number[], periodId: number): Promise<IFCRow[]> {
	const envelope = await apiPost<Envelope<IFCRow[]>>('/ifcs/list', {
		chart_ids: chartIds.map(Number),
		period_id: Number(periodId),
	});
	if (!envelope?.data) throw new ApiError('ifcs.error.generic');
	return envelope.data;
}

export async function getIFCView(id: number): Promise<IFCViewPayload> {
	const envelope = await apiGet<Envelope<IFCViewPayload>>(`/ifcs/get-by-id/${id}`);
	if (!envelope?.data) throw new ApiError('ifcs.error.viewFailed');

	envelope.data.ifc.id = Number(envelope.data.ifc.id);
	if (envelope.data.ifc.coordinator.user_id != null) {
		envelope.data.ifc.coordinator.user_id = Number(envelope.data.ifc.coordinator.user_id);
	}
	envelope.data.findings.forEach((f) => {
		f.id = Number(f.id);
		f.actions.forEach((a) => {
			a.id = Number(a.id);
		});
	});
	envelope.data.previous_actions = (envelope.data.previous_actions ?? []).map((p) => ({
		...p,
		id: Number(p.id),
		finding_action_id: Number(p.finding_action_id),
		finding: { id: Number(p.finding.id), code: p.finding.code },
	}));
	return envelope.data;
}

export async function submitIFC(id: number): Promise<SubmitResult> {
	const envelope = await apiPost<Envelope<SubmitResult>>(`/ifcs/${id}/submit`);
	if (!envelope?.data) throw new ApiError('ifcs.error.submitFailed');

	const n = envelope.data.notification;
	return {
		id: Number(envelope.data.id),
		notification: {
			sent: Boolean(n?.sent),
			recipients_count: Number(n?.recipients_count ?? 0),
			cc_count: Number(n?.cc_count ?? 0),
			reason: (n?.reason ?? null) as SubmitResult['notification']['reason'],
		},
	};
}

export async function approveIFC(id: number): Promise<void> {
	await apiPost(`/ifcs/${id}/approve`);
}

export async function rejectIFC(id: number, comment: RejectIFCBody['comment']): Promise<void> {
	await apiPost(`/ifcs/${id}/reject`, { comment });
}

export async function getIFCPrefill(chartId: number, periodId: number): Promise<IFCPrefill> {
	const envelope = await apiGet<Envelope<IFCPrefill>>(
		`/ifcs/prefill?chart_id=${chartId}&period_id=${periodId}`,
	);
	if (!envelope?.data) throw new ApiError('ifcs.error.prefillFailed');
	envelope.data.previous_actions = (envelope.data.previous_actions ?? []).map((p) => ({
		...p,
		id: Number(p.id),
		finding_action_id: Number(p.finding_action_id),
		finding: { id: Number(p.finding.id), code: p.finding.code },
	}));
	return envelope.data;
}

function parseSaveResult(data: {
	id: number;
	notification?: SubmitResult['notification'];
}): SubmitResult {
	const n = data.notification;
	return {
		id: Number(data.id),
		notification: {
			sent: Boolean(n?.sent),
			recipients_count: Number(n?.recipients_count ?? 0),
			cc_count: Number(n?.cc_count ?? 0),
			reason: (n?.reason ?? null) as SubmitResult['notification']['reason'],
		},
	};
}

export async function createIFC(payload: CreateIFCBody): Promise<SubmitResult> {
	const envelope = await apiPost<Envelope<{
		id: number;
		notification?: SubmitResult['notification'];
	}>>('/ifcs/create', payload);
	if (!envelope?.data) throw new ApiError('ifcs.error.createFailed');
	return parseSaveResult(envelope.data);
}

export async function patchIFC(id: number, payload: PatchIFCBody): Promise<SubmitResult> {
	const envelope = await apiPatch<Envelope<{
		id: number;
		notification?: SubmitResult['notification'];
	}>>(`/ifcs/${id}`, payload);
	if (!envelope?.data) throw new ApiError('ifcs.error.patchFailed');
	return parseSaveResult(envelope.data);
}
