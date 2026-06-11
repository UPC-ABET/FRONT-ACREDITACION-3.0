export type ApiResponse<T> = {
	code: number;
	message: string;
	data: T;
};

export type ApiEnvelope<T> = {
	data?: T;
	resource?: T;
	message?: string;
};

export type Pagination = {
	page: number;
	pageSize: number;
	total: number;
};

export type SelectOption<T = string> = {
	label: string;
	value: T;
};

export type BaseEntity = {
	id: string | number;
	createdAt?: string;
	updatedAt?: string;
};
