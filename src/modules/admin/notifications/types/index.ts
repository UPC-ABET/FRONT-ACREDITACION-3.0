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
	emailTemplateId: number | null;
	name: I18nText;
	subject: I18nText;
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
	name: I18nText;
	subject: I18nText;
	body: I18nText;
	toChartEntityTypeIds?: number[];
	ccChartEntityTypeIds?: number[];
	isActive?: boolean;
}

// ─── Survey notifications (/notification-messages) ──────────────────────────────

export interface SurveyMessage {
	id: number;
	surveyTypeId: number;
	programId: number;
	emailTemplateId: number | null;
	name: I18nText;
	subject: I18nText;
	body: I18nText;
	ccReceivers: unknown;
	isActive: boolean;
}

export interface SurveyMessageBody {
	surveyTypeId: number;
	programId: number;
	name: I18nText;
	subject: I18nText;
	body: I18nText;
	ccReceivers?: unknown;
	isActive?: boolean;
}

export interface SurveyMessageFilters {
	surveyTypeId?: number;
	programId?: number;
	emailTemplateId?: number;
	isActive?: boolean;
}

// ─── Email templates (/email-templates) ─────────────────────────────────────────

export interface EmailTemplate {
	id: number;
	isActive: boolean;
	categoryTypeId: number;
	code: string;
	name: I18nText;
	subject: I18nText;
	body: I18nText;
	extra: Record<string, unknown> | null;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface EmailTemplateBody {
	categoryTypeId: number;
	code: string;
	name: I18nText;
	subject: I18nText;
	body: I18nText;
	isActive?: boolean;
	extra?: Record<string, unknown>;
}

export interface EmailTemplateFilters {
	categoryTypeId?: number;
	code?: string;
	isActive?: boolean;
}

// ─── Notification logs (/notification-logs) ─────────────────────────────────────

export interface NotificationLog {
	id: number;
	categoryTypeId: number;
	emailTemplateId: number | null;
	notifierUserId: number | null;
	toEmails: string[];
	ccEmails: string[];
	toStaffIds: number[];
	ccStaffIds: number[];
	providerMessageId: string | null;
	status: string;
	errorMessage: string | null;
	context: Record<string, unknown> | null;
	createdAt: string | null;
}

export interface NotificationLogFilters {
	categoryTypeId?: number;
	emailTemplateId?: number;
	notifierUserId?: number;
	status?: string;
	isActive?: boolean;
}

// Lightweight option for program selectors.
export interface ProgramOption {
	id: number;
	name: string;
	code?: string;
}
