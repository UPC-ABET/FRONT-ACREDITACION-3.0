export class ApiError extends Error {
	readonly status: number;
	readonly body: unknown;

	constructor(message: string, status = 0, body?: unknown) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.body = body;
	}
}

export function getErrorMessage(error: unknown, fallbackKey = 'error.generic'): string {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	return fallbackKey;
}

/**
 * Extracts the backend reason keys from an ApiError envelope (`data: string[]`),
 * e.g. the "in use" blockers returned on a 409. Returns [] when absent.
 */
export function getApiErrorReasons(error: unknown): string[] {
	if (error instanceof ApiError && error.body && typeof error.body === 'object') {
		const data = (error.body as { data?: unknown }).data;
		if (Array.isArray(data)) return data.filter((item): item is string => typeof item === 'string');
	}
	return [];
}
