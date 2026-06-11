export type LoginResponse = {
	code: number;
	message: string;
	data: {
		user: unknown;
		accessToken: string;
		expiresIn: number;
	};
};

export type ForgotPasswordResponse = {
	code: number;
	message: string;
	data?: {
		message?: string;
	};
};
