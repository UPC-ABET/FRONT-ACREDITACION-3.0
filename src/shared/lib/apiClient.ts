/**
 * SHARED API CLIENT
 *
 * Cliente HTTP base compartido para toda la app.
 */

import { ApiError } from './apiError';
import { logger } from './logger';
import { getSchoolCookie } from './authCookies';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export { triggerFileDownload, triggerBlobDownload, fileToBase64 } from '@/shared/lib/fileDownload';

export type ApiEnvelope<T> = {
	data?: T;
	resource?: T;
	message?: string;
};

type RequestJsonOptions = {
	method?: RequestMethod;
	body?: unknown;
	headers?: Record<string, string>;
	token?: string;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
export const API_URL = RAW_API_URL.replace(/\/$/, '');

if (typeof window !== 'undefined' && !API_URL) {
	throw new Error('NEXT_PUBLIC_API_URL is not configured. Check your .env.local file.');
}

export const getApiBaseUrl = (): string => {
	if (!API_URL) {
		throw new Error('auth.missingApiUrl');
	}
	return API_URL;
};

export function getToken(): string {
	return '';
}

export function authHeader(): Record<string, string> {
	const token = getToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

const SCHOOL_HEADER = 'X-School-Id';
const ACADEMIC_PERIOD_HEADER = 'X-Academic-Period-Id';
const MODALITY_TYPE_HEADER = 'X-Modality-Type-Id';

let activeSchoolId: number | null = null;
let activeSchoolIdInitialized = false;
let activeAcademicPeriodId: number | null = null;
let activeModalityTypeId: number | null = null;

function normalizePositiveId(value: unknown): number | null {
	return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

export function setActiveSchoolId(schoolId: number | null): void {
	activeSchoolId = normalizePositiveId(schoolId);
	activeSchoolIdInitialized = true;
}

export function setActiveAcademicPeriodId(academicPeriodId: number | null): void {
	activeAcademicPeriodId = normalizePositiveId(academicPeriodId);
}

export function setActiveModalityTypeId(modalityTypeId: number | null): void {
	activeModalityTypeId = normalizePositiveId(modalityTypeId);
}

function resolveSchoolId(): number | null {
	if (!activeSchoolIdInitialized) {
		activeSchoolId = normalizePositiveId(getSchoolCookie()?.id);
		activeSchoolIdInitialized = true;
	}
	return activeSchoolId;
}

export function buildHeaders(
	extra: Record<string, string> = {},
	isFormData = false,
	tokenOverride?: string,
): Record<string, string> {
	const token = tokenOverride ?? getToken();
	const schoolId = resolveSchoolId();

	return {
		accept: '*/*',
		'ngrok-skip-browser-warning': 'true',
		...(isFormData ? {} : { 'Content-Type': 'application/json' }),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...(schoolId === null ? {} : { [SCHOOL_HEADER]: String(schoolId) }),
		...(activeAcademicPeriodId === null
			? {}
			: { [ACADEMIC_PERIOD_HEADER]: String(activeAcademicPeriodId) }),
		...(activeModalityTypeId === null
			? {}
			: { [MODALITY_TYPE_HEADER]: String(activeModalityTypeId) }),
		...extra,
	};
}

export function getApiData<T = unknown>(response: unknown): T {
	if (response && typeof response === 'object') {
		const env = response as ApiEnvelope<T>;

		if (env.data !== undefined) return env.data as T;
		if (env.resource !== undefined) return env.resource as T;
	}

	return response as T;
}

function joinUrl(path: string): string {
	const baseUrl = getApiBaseUrl();

	if (!path) return baseUrl;
	if (/^https?:\/\//i.test(path)) return path;

	return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function parseBody<T>(res: Response): Promise<T> {
	const contentType = res.headers.get('content-type') ?? '';

	if (contentType.includes('application/json')) {
		return (await res.json()) as T;
	}

	const text = await res.text();

	if (!text) return undefined as T;

	try {
		return JSON.parse(text) as T;
	} catch (e) {
		logger.warn('[api-client] Response body is not valid JSON, returning as text', {
			contentType,
			text: text.slice(0, 200),
			error: e,
		});
		return text as T;
	}
}

async function request<T>(
	path: string,
	init: RequestInit,
	{ isFormData = false, tokenOverride }: { isFormData?: boolean; tokenOverride?: string } = {},
): Promise<T> {
	const url = joinUrl(path);

	const mergedHeaders = {
		...buildHeaders({}, isFormData, tokenOverride),
		...(init.headers ?? {}),
	};

	const res = await fetch(url, {
		...init,
		headers: mergedHeaders,
		credentials: 'include',
	});

	if (!res.ok) {
		const errorBody = await parseBody<unknown>(res).catch((e) => {
			logger.warn('[api-client] Failed to parse error response body', {
				url,
				status: res.status,
				error: e,
			});
			return null;
		});

		const message =
			(errorBody as { message?: string } | null)?.message ?? `${res.status} ${res.statusText}`;

		throw new ApiError(message, res.status, errorBody);
	}

	return parseBody<T>(res);
}

export function apiGet<T = unknown>(path: string, init?: RequestInit): Promise<T> {
	return request<T>(path, { method: 'GET', ...init });
}

export function apiPost<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
	return request<T>(path, {
		method: 'POST',
		body: body !== undefined ? JSON.stringify(body) : undefined,
		...init,
	});
}

export function apiPut<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
	return request<T>(path, {
		method: 'PUT',
		body: body !== undefined ? JSON.stringify(body) : undefined,
		...init,
	});
}

export function apiPatch<T = unknown>(
	path: string,
	body?: unknown,
	init?: RequestInit,
): Promise<T> {
	return request<T>(path, {
		method: 'PATCH',
		body: body !== undefined ? JSON.stringify(body) : undefined,
		...init,
	});
}

export function apiDelete<T = unknown>(
	path: string,
	body?: unknown,
	init?: RequestInit,
): Promise<T> {
	return request<T>(path, {
		method: 'DELETE',
		body: body !== undefined ? JSON.stringify(body) : undefined,
		...init,
	});
}

export function apiUploadFormData<T = unknown>(
	path: string,
	formData: FormData,
	init?: RequestInit,
): Promise<T> {
	return request<T>(
		path,
		{
			method: 'POST',
			body: formData,
			...init,
		},
		{ isFormData: true },
	);
}

export async function apiPostBlobResponse(
	path: string,
	body: unknown,
	extraHeaders?: Record<string, string>,
): Promise<{ blob: Blob; response: Response }> {
	const url = joinUrl(path);

	const res = await fetch(url, {
		method: 'POST',
		headers: { ...buildHeaders(), ...extraHeaders },
		credentials: 'include',
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new ApiError(text || `HTTP ${res.status}`, res.status);
	}

	return { blob: await res.blob(), response: res };
}

export async function apiPostBlob(path: string, body: unknown): Promise<Blob> {
	const { blob } = await apiPostBlobResponse(path, body);
	return blob;
}

export async function apiGetBlobResponse(
	path: string,
	extraHeaders?: Record<string, string>,
): Promise<{ blob: Blob; response: Response }> {
	const url = joinUrl(path);

	const res = await fetch(url, {
		method: 'GET',
		headers: { ...buildHeaders(), ...extraHeaders },
		credentials: 'include',
	});

	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new ApiError(text || `HTTP ${res.status}`, res.status);
	}

	return { blob: await res.blob(), response: res };
}

export const requestJson = async <T>(
	path: string,
	{ method = 'GET', body, headers, token }: RequestJsonOptions = {},
): Promise<{ response: Response; body: T | null }> => {
	const response = await fetch(joinUrl(path), {
		method,
		headers: buildHeaders(headers ?? {}, false, token),
		credentials: 'include',
		...(body !== undefined ? { body: JSON.stringify(body) } : {}),
	});

	const parsedBody = (await response.json().catch(() => null)) as T | null;

	return { response, body: parsedBody };
};
