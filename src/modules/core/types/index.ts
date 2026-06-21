export type TypeResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	typeGroupId: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

export type TypeItemResponse = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
	typeGroupId: number;
};

export type TypeGroupResponse = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

export interface TypeOption {
	id: number;
	code: string;
	name: { es: string; en: string };
	description: Record<string, string>;
	extra?: Record<string, unknown>;
}

export interface ParameterRow<T> {
	id: number;
	code: string;
	value: T;
	name: Record<string, string>;
	description: Record<string, string>;
	isActive: boolean;
}
