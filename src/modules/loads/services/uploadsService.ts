import { apiPost, apiUploadFormData, getApiData } from '@/shared/lib/apiClient';
import { findFlowByCode } from '../constants';
import type { UploadPayload, UploadResult, RollbackPayload } from '../types';

function buildForm(file: File, academicPeriodId: number): FormData {
	const fd = new FormData();
	fd.append('file', file);
	fd.append('academic_period_id', String(academicPeriodId));
	return fd;
}

function resolveFlowPath(flowCode: string): string {
	const flow = findFlowByCode(flowCode);
	if (!flow) throw new Error(`Unknown flow code: ${flowCode}`);
	return flow.uploadPath;
}

export async function uploadFile(flowCode: string, payload: UploadPayload): Promise<UploadResult> {
	const path = resolveFlowPath(flowCode);
	const response = await apiUploadFormData(
		`${path}/upload`,
		buildForm(payload.file, payload.academicPeriodId),
	);
	return getApiData<UploadResult>(response);
}

export async function rollbackUpload(
	flowCode: string,
	payload: RollbackPayload,
): Promise<{ success: boolean }> {
	const path = resolveFlowPath(flowCode);
	const response = await apiPost(`${path}/rollback`, { upload_log_id: payload.uploadLogId });
	return getApiData<{ success: boolean }>(response);
}
