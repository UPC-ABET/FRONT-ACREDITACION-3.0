import type { I18nText } from '@/shared/types';

export interface DeanConfig {
	chartId: number;
	staffId: number;
	lastName: string;
	firstName: string;
	userId: number | null;
	title: I18nText;
}

export interface DirectorConfig {
	chartId: number;
	staffId: number;
	schoolId: number;
	schoolCode: string;
	lastName: string;
	firstName: string;
	userId: number | null;
	title: I18nText;
}

export interface ChartHeadsConfig {
	dean: DeanConfig | null;
	directors: DirectorConfig[];
}

export interface DeanPayload {
	lastName: string;
	firstName: string;
	userId?: number | null;
	title: I18nText;
}

export interface DirectorPayload {
	schoolId: number;
	lastName: string;
	firstName: string;
	userId?: number | null;
	title: I18nText;
}

export interface ConfigureChartHeadsPayload {
	academicPeriodId: number;
	dean: DeanPayload;
	directors: DirectorPayload[];
}

export interface SchoolOption {
	id: number;
	code: string;
	name: string;
}

export interface UserOption {
	id: number;
	label: string;
}

export interface HeadFormValue {
	lastName: string;
	firstName: string;
	userId: number | null;
	title: I18nText;
}

export interface DirectorFormValue extends HeadFormValue {
	key: string;
	schoolId: number | null;
}

export interface ChartHeadsFormValue {
	dean: HeadFormValue;
	directors: DirectorFormValue[];
}

export interface HeadFormErrors {
	firstName?: string;
	lastName?: string;
	title?: string;
}

export interface DirectorFormErrors extends HeadFormErrors {
	schoolId?: string;
}

export interface ChartHeadsFormErrors {
	dean?: HeadFormErrors;
	directors: Record<string, DirectorFormErrors>;
}
