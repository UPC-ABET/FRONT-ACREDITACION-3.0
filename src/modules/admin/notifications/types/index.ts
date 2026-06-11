import type { I18nText } from '@/shared/types';

export interface NotificationConfig {
	id: number;
	schoolId: number;
	academicPeriodId: number;
	triggerTypeId: number;
	triggerCode: string;
	triggerName: I18nText;
	ifcStatusTypeId: number;
	statusCode: string;
	statusName: I18nText;
	title: I18nText;
	body: I18nText;
	toChartEntityTypeIds: number[];
	ccChartEntityTypeIds: number[];
	isActive: boolean;
}

export interface NotifyVar {
	var: string;
	description: I18nText;
	validStatusCodes: string[] | null;
}

export interface CoreType {
	id: number;
	code: string;
	name: I18nText;
}

export interface UpsertConfigBody {
	academicPeriodId: number;
	triggerTypeId: number;
	ifcStatusTypeId: number;
	title: I18nText;
	body: I18nText;
	toChartEntityTypeIds?: number[];
	ccChartEntityTypeIds?: number[];
	isActive?: boolean;
}
