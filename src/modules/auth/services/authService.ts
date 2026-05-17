import type { LoginPayload } from '@/shared/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const USERS_BASE_PATH = `${BASE_URL}/users`;

type LoginResponse = {
	code: number;
	message: string;
	data: {
		user: any;
		access_token: string;
	};
};

export const loginByCredentials = async (
	payload: LoginPayload,
): Promise<{ accessToken: string; user: any }> => {
	if (!BASE_URL) {
		throw new Error('auth.missingApiUrl');
	}

	const res = await fetch(`${USERS_BASE_PATH}/login-by-credentials`, {
		method: 'POST',
		headers: {
			accept: '*/*',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			school_code: payload.school_code,
			email: payload.email,
			password: payload.password,
		}),
	});

	const body = (await res.json().catch(() => null)) as LoginResponse | null;

	if (!res.ok || !body?.data?.access_token) {
		throw new Error(body?.message || 'login.error.generic');
	}

	return {
		accessToken: body.data.access_token,
		user: body.data.user,
	};
};

const getStoredToken = () => {
	const raw = localStorage.getItem('bearerToken');
	if (!raw) return '';
	try {
		return JSON.parse(raw) as string;
	} catch {
		return '';
	}
};

export const logoutUser = async (): Promise<void> => {
	if (!BASE_URL) {
		throw new Error('auth.missingApiUrl');
	}

	const token = getStoredToken();

	await fetch(`${USERS_BASE_PATH}/logout`, {
		method: 'POST',
		headers: {
			accept: '*/*',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});
};

export const getMicrosoftLoginUrl = (school_code: string): string => {
	if (!BASE_URL) {
		throw new Error('auth.missingApiUrl');
	}
	if (!school_code) {
		throw new Error('login.error.schoolRequired');
	}

	return `${BASE_URL}/auth/microsoft?school_code=${encodeURIComponent(school_code)}`;
};
