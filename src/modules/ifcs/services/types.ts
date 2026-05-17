export type I18nText = Record<string, string>;

export interface ScopeOption {
	id: number;
	label: I18nText;
	parent_id: number | null;
}

export interface ScopeLevel {
	level_num: number;
	type_code: string;
	options: ScopeOption[];
}

export interface ScopeTree {
	highest_level: number | null;
	levels: ScopeLevel[];
}

export interface IFCRecord {
	id: number;
	information: Record<string, unknown>;
	extra: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	status_code: string;
	status_label: I18nText;
}

export interface IFCRow {
	chart_id: number;
	course_code: string;
	course_name: I18nText;
	program_label: I18nText;
	coordinator_user_id: number | null;
	coordinator_name: string | null;
	ifc: IFCRecord | null;
}

export interface AcademicPeriod {
	id: number;
	code: string;
	start_date: string;
	end_date: string;
}

export type SelectionValue = number | 'ALL' | null;

export type IFCStatusFilter = 'ALL' | string;
