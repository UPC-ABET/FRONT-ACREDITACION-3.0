import type { I18nText } from '@/shared/types';

export interface LinkedUserRef {
	id: number;
	firstName: string;
	lastName: string;
	email?: string;
}

export interface TeacherOption {
	staffId: number;
	code: string | null;
	firstName: string;
	lastName: string;
	user: LinkedUserRef | null;
}

export interface HeadConfig {
	chartId: number;
	staffId: number;
	code: string | null;
	firstName: string;
	lastName: string;
	userId: number | null;
	user: LinkedUserRef | null;
	title: I18nText;
}

export interface DirectorConfig extends HeadConfig {
	schoolId: number;
	schoolCode: string;
}

export interface ChartHeadsConfig {
	dean: HeadConfig | null;
	directors: DirectorConfig[];
}

export interface HeadPayload {
	staffId: number;
	userId: number | null;
	title: I18nText;
}

export interface DirectorPayload extends HeadPayload {
	schoolId: number;
}

export interface ConfigureChartHeadsPayload {
	academicPeriodId: number;
	dean: HeadPayload;
	directors: DirectorPayload[];
}

export interface SchoolOption {
	id: number;
	code: string;
	name: string;
}

export interface LinkedStaffRef {
	id: number;
	code: string | null;
	firstName: string;
	lastName: string;
}

export interface UserOption {
	id: number;
	firstName: string;
	lastName: string;
	email?: string;
	staff: LinkedStaffRef | null;
	label: string;
}

export interface SelectedUser {
	id: number;
	label: string;
}

export interface HeadFormValue {
	teacher: TeacherOption | null;
	user: SelectedUser | null;
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
	teacher?: string;
	title?: string;
}

export interface DirectorFormErrors extends HeadFormErrors {
	schoolId?: string;
}

export interface ChartHeadsFormErrors {
	dean?: HeadFormErrors;
	directors: Record<string, DirectorFormErrors>;
}

export interface RawLinkedStaff {
	id: number;
	code?: string | null;
	firstName?: string;
	lastName?: string;
}

export interface RawUser {
	id: number | string;
	name?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	staff?: RawLinkedStaff | null;
}

export interface RawSchool {
	id: number | string;
	code: string;
	name: string | I18nText;
}
