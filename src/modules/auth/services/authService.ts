import { requestJson, getApiBaseUrl, clearPreferenceCookies, ApiError } from '@/shared/lib';
import type { LoginPayload, LoginResponse } from '@/modules/auth/types';

const USERS_BASE_PATH = '/users';

export const loginByCredentials = async (payload: LoginPayload): Promise<void> => {
	const { response, body } = await requestJson<LoginResponse>(
		`${USERS_BASE_PATH}/login-by-credentials`,
		{
			method: 'POST',
			body: {
				email: payload.email,
				password: payload.password,
			},
		},
	);

	if (!response.ok) {
		throw new ApiError(body?.message ?? 'auth.error.loginFailed', response.status);
	}
};

export const clearClientSession = () => {
	if (typeof window === 'undefined') return;
	clearPreferenceCookies();
};

export const logoutUser = async (): Promise<void> => {
	await requestJson(`${USERS_BASE_PATH}/logout`, {
		method: 'POST',
	});
};

export const getMicrosoftLoginUrl = (): string => {
	return `${getApiBaseUrl()}/auth/microsoft`;
};

export const requestForgotPassword = async (email: string): Promise<string> => {
	const { response, body } = await requestJson<{
		code: number;
		message: string;
		data?: { message?: string };
	}>('/auth/forgot-password', {
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
