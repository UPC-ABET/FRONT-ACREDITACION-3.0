import type { LoginPayload } from '@/shared/types';
import { requestJson, getApiBaseUrl } from '@/shared/lib';
import type { LoginResponse, ForgotPasswordResponse } from '@/modules/auth/types';

const USERS_BASE_PATH = '/users';

export const loginByCredentials = async (
	payload: LoginPayload,
): Promise<{ accessToken: string; user: unknown }> => {
	const { response, body } = await requestJson<LoginResponse>(
		`${USERS_BASE_PATH}/login-by-credentials`,
		{
			method: 'POST',
			body: {
				school_code: payload.school_code,
				email: payload.email,
				password: payload.password,
			},
		},
	);

	if (!response.ok || !body?.data?.access_token) {
		throw new Error(body?.message);
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

export const clearClientSession = () => {
	if (typeof window === 'undefined') return;
	window.localStorage.removeItem('bearerToken');
	window.localStorage.removeItem('token');
	window.localStorage.removeItem('escuela');
};

export const logoutUser = async (): Promise<void> => {
	const token = getStoredToken();

	await requestJson(`${USERS_BASE_PATH}/logout`, {
		method: 'POST',
		token,
	});
};

export const getMicrosoftLoginUrl = (school_code: string): string => {
	if (!school_code) {
		throw new Error('login.error.schoolRequired');
	}

	return `${getApiBaseUrl()}/auth/microsoft?school_code=${encodeURIComponent(school_code)}`;
};

export const requestForgotPassword = async (email: string): Promise<string> => {
	const { response, body } = await requestJson<ForgotPasswordResponse>('/auth/forgot-password', {
		method: 'POST',
		body: { email },
	});

	if (!response.ok) {
		throw new Error(body?.message);
	}

	return body?.data?.message ?? body?.message ?? '';
};

export const requestResetPassword = async (
	token: string,
	password: string,
	confirmPassword: string,
): Promise<string> => {
	// Temporal mock until backend endpoint is available.
	await new Promise((resolve) => setTimeout(resolve, 500));

	if (!token) {
		throw new Error('resetPassword.error.invalidToken');
	}
	if (password.length < 8) {
		throw new Error('resetPassword.error.passwordMinLength');
	}
	if (password !== confirmPassword) {
		throw new Error('resetPassword.error.passwordMismatch');
	}

	return 'resetPassword.success.defaultMessage';
};
