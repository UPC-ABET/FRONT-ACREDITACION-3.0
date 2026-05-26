import type { I18nText } from '@/shared/types';

export interface ParameterRow<T = unknown> {
	id: number;
	code: string;
	value: T;
	name: I18nText;
	description: I18nText;
	is_active: boolean;
	extra?: Record<string, unknown>;
	created_at?: string;
	updated_at?: string | null;
}

export interface UpdateParameterBody<T = unknown> {
	value?: T;
	name?: I18nText;
	description?: I18nText;
	code?: string;
	is_active?: boolean;
	extra?: Record<string, unknown>;
}


export interface IFCFieldDescriptor {
	key: string;
	label: I18nText;
	required: boolean;
	order: number;
}
