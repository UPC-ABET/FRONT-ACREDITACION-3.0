export type TypeResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	type_group_id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

export type TypeItemResponse = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
	type_group_id: number;
};

export type TypeGroupResponse = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};
