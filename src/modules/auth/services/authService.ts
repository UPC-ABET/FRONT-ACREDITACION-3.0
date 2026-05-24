import type { LoginPayload } from '@/shared/types';
import { requestJson, getApiBaseUrl, clearAuthCookies, ApiError } from '@/shared/lib';
import type { LoginResponse, ForgotPasswordResponse } from '@/modules/auth/types';

const USERS_BASE_PATH = '/users';

export const loginByCredentials = async (
	payload: LoginPayload,
): Promise<{ user: unknown; expiresIn: number }> => {
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
		throw new ApiError(body?.message ?? 'auth.error.loginFailed', response.status);
	}

	return {
		user: body.data.user,
		expiresIn: body.data.expires_in,
	};
};

export const clearClientSession = () => {
	if (typeof window === 'undefined') return;
	clearAuthCookies();
};

export const logoutUser = async (): Promise<void> => {
	await requestJson(`${USERS_BASE_PATH}/logout`, {
		method: 'POST',
	});
};

export const getMicrosoftLoginUrl = (school_code: string): string => {
	if (!school_code) {
		throw new ApiError('login.error.schoolRequired');
	}

	return `${getApiBaseUrl()}/auth/microsoft?school_code=${encodeURIComponent(school_code)}`;
};

export const requestForgotPassword = async (email: string): Promise<string> => {
	const { response, body } = await requestJson<ForgotPasswordResponse>('/auth/forgot-password', {
		method: 'POST',
		body: { email },
	});

	if (!response.ok) {
		throw new ApiError(body?.message ?? 'auth.error.forgotPasswordFailed', response.status);
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
		throw new ApiError('resetPassword.error.invalidToken');
	}
	if (password.length < 8) {
		throw new ApiError('resetPassword.error.passwordMinLength');
	}
	if (password !== confirmPassword) {
		throw new ApiError('resetPassword.error.passwordMismatch');
	}

	return 'resetPassword.success.defaultMessage';
};
