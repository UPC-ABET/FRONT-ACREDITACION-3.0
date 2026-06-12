import { apiGetBlobResponse, apiPost, apiUploadFormData, getApiData } from '@/shared/lib/apiClient';
import { triggerBlobDownload } from '@/shared/lib/fileDownload';
import { findFlowByTypeCode } from '../constants';
import type { UploadPayload, UploadResult, RollbackPayload } from '../types';

function buildForm(payload: UploadPayload): FormData {
	const fd = new FormData();
	fd.append('file', payload.file);
	if (payload.userId !== undefined) fd.append('userId', String(payload.userId));
	if (payload.lang) fd.append('lang', payload.lang);
	return fd;
}

function resolveFlow(typeCode: string) {
	const flow = findFlowByTypeCode(typeCode);
	if (!flow) throw new Error(`Unknown upload type code: ${typeCode}`);
	return flow;
}

function parseContentDispositionFilename(header: string | null): string | null {
	if (!header) return null;
	const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(header);
	if (utf8Match?.[1]) {
		try {
			return decodeURIComponent(utf8Match[1]);
		} catch {
			return utf8Match[1];
		}
	}
	const plainMatch = /filename="?([^";]+)"?/i.exec(header);
	return plainMatch?.[1] ?? null;
}

export async function uploadFile(typeCode: string, payload: UploadPayload): Promise<UploadResult> {
	const flow = resolveFlow(typeCode);
	const response = await apiUploadFormData(flow.uploadPath, buildForm(payload));
	return getApiData<UploadResult>(response);
}

export async function rollbackUpload(
	typeCode: string,
	payload: RollbackPayload,
): Promise<{ success: boolean }> {
	const flow = resolveFlow(typeCode);
	const response = await apiPost(flow.rollbackPath, { uploadLogId: payload.uploadLogId });
	return getApiData<{ success: boolean }>(response);
}

export async function downloadTemplate(
	typeCode: string,
	lang: 'es' | 'en',
	fallbackFileName: string,
): Promise<void> {
	const flow = resolveFlow(typeCode);
	const { blob, response } = await apiGetBlobResponse(
		`${flow.templatePath}?lang=${encodeURIComponent(lang)}`,
	);
	const fileName =
		parseContentDispositionFilename(response.headers.get('content-disposition')) ??
		fallbackFileName;
	triggerBlobDownload(blob, fileName);
}
