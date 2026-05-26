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
