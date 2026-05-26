import type { I18nText } from '@/shared/types';

export interface NotificationConfig {
	id: number;
	school_id: number;
	academic_period_id: number;
	trigger_type_id: number;
	trigger_code: string;
	trigger_name: I18nText;
	ifc_status_type_id: number;
	status_code: string;
	status_name: I18nText;
	title: I18nText;
	body: I18nText;
	to_chart_level_type_ids: number[];
	cc_chart_level_type_ids: number[];
	is_active: boolean;
}

export interface NotifyVar {
	var: string;
	description: I18nText;
	valid_status_codes: string[] | null;
}

export interface CoreType {
	id: number;
	code: string;
	name: I18nText;
}

export interface UpsertConfigBody {
	academic_period_id: number;
	trigger_type_id: number;
	ifc_status_type_id: number;
	title: I18nText;
	body: I18nText;
	to_chart_level_type_ids?: number[];
	cc_chart_level_type_ids?: number[];
	is_active?: boolean;
}
