export type LoginResponse = {
	code: number;
	message: string;
	data: {
		user: unknown;
		access_token: string;
	};
};

export type ForgotPasswordResponse = {
	code: number;
	message: string;
	data?: {
		message?: string;
	};
};
