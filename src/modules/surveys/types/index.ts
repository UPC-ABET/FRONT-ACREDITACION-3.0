import type { I18nText } from '@/shared/types';

export type SurveyType = 'PPP' | 'GRA' | 'LCFC';

export interface PageRequest {
	pageNumber: number;
	pageSize: number;
}

export interface PageInfo {
	totalRecords: number;
	pageNumber: number;
	pageSize: number;
	totalPages: number;
}

export interface AcademicPeriod {
	id: number;
	name: string;
	code?: string;
}

export interface Program {
	id: number;
	name: string;
	code?: string;
}

export interface CompetenceConfig {
	id: number;
	outcomeId?: number;
	generalCompetence: string;
	specificCompetence: string;
	description: string;
	descriptionEn?: string;
	performanceLevel: number;
	isActive?: boolean;
	isVisible?: boolean;
	isExternal?: boolean;
	programId?: number;
	periodId?: number;
}

export interface CompetenceFormData {
	id: number;
	outcomeId?: number;
	generalCompetence: string;
	specificCompetence: string;
	description: string;
	descriptionEn?: string;
	performanceLevel: number;
	isVisible?: boolean;
	isExternal?: boolean;
	academicPeriodId: number;
	programId?: number;
	school: string;
}

export interface PerformanceLevel {
	id?: number;
	level: number;
	description: string;
	range: string;
	minScore?: number;
	maxScore?: number;
	color?: string;
}

export interface FileResource {
	fileContents: string;
	contentType: string;
	fileDownloadName: string;
}

export interface PPPCloneRequest {
	sourceAcademicPeriodId: number;
	targetAcademicPeriodId: number;
	programId: number;
}

export interface GRAStudent {
	notificationId: number;
	studentId: number;
	studentCode: string;
	studentName: string;
	studentEmail: string;
	sendStatus: string;
	sendDate?: string;
	responseStatus?: string;
	responseDate?: string;
}

export interface StudentSearchResult {
	studentId: number;
	code: string;
	name: string;
	email: string;
	career: string;
	cycle?: string;
}

export interface EmailTemplate {
	surveyId?: number;
	code?: string;
	name?: string;
	subject: string;
	body: string;
	htmlContent?: string;
	templateLanguage?: string;
}

export interface MassiveUploadResult {
	total: number;
	success: number;
	failed: number;
	errors: Array<{ row?: number; code?: string; reason: string }>;
}

export interface SendEmailResponse {
	success: boolean;
	data?: {
		sent: number;
		failed: number;
		failureDetails?: Array<{ studentId: number; reason: string }>;
	};
	message?: string;
}

export interface GRAEmailSendRequest {
	academicPeriodId: number;
	programId: number;
	surveyBaseUrl: string;
	notificationMessageId?: number;
}

export type LCFCConfigStatus = 'ACTIVE' | 'INACTIVE';
export type DashboardColor = 'RED' | 'YELLOW' | 'GREEN';

export interface LCFCCourse {
	id: number;
	outcomeId: number;
	courseName: string;
	code: string;
	isActive: boolean;
	name: I18nText;
	description: I18nText;
	programId?: number;
	academicPeriodId?: number;
}

export interface LCFCConfigUpdateRequest {
	userOutcomeName?: I18nText;
	userOutcomeDescription?: I18nText;
	isActive?: boolean;
}

export interface LCFCStudent {
	studentId: number;
	code: string;
	name: string;
	email: string;
	surveySent: boolean;
	surveyCompleted: boolean;
}

export interface LCFCEmailParam {
	name: string;
	description: string;
}

export interface LCFCNotificationSendRequest {
	academicPeriodId: number;
	programId: number;
	campusId?: number;
	courseSectionId?: number;
	maxRegisterDate: string;
	surveyBaseUrl: string;
	notificationMessageId?: number;
}

export interface PPPNotificationSendRequest {
	academicPeriodId: number;
	programId: number;
	surveyBaseUrl: string;
	maxRegisterDate?: string;
	notificationMessageId?: number;
}

export interface LCFCConfigItem {
	configId?: number;
	courseId?: number;
	courseName?: string;
	status?: LCFCConfigStatus;
	commissions?: Array<{ commissionId: number; commissionName: string }>;
}

export interface SurveyOutcome {
	outcomeId: number;
	outcomeConfigId?: number;
	commissionId: number;
	generalCompetence?: string;
	specificCompetence: string;
	description: string;
	score: number | null;
	responseType?: string;
	weight?: number;
}

export interface SurveyCommissionGroup {
	commissionName: string;
	commissionId: number;
	outcomes: SurveyOutcome[];
}

export interface SurveyTokenVerification {
	token?: string;
	school: string;
	schoolId?: number;
	schoolName?: string;
	programName: string;
	period: string;
	studentCode?: string;
	studentName?: string;
	courseName?: string;
	courseCode?: string;
	answered: boolean;
	studentId: number;
	surveyId: number;
	tokenValid?: boolean;
	daysRemaining?: number;
}

export interface SurveyOutcomesResponse {
	school: string;
	schoolName?: string;
	programName: string;
	period: string;
	courseName?: string;
	courseCode?: string;
	surveyId: number;
	items: SurveyCommissionGroup[];
}

export interface SurveySubmitItem {
	commissionId: number;
	outcomeId: number;
	score: number;
	description?: string;
}

export interface SurveySubmitRequest {
	token?: string;
	comment: string;
	surveyId: number;
	school: string;
	items: SurveySubmitItem[];
}

export interface SurveySubmitResponse {
	success: boolean;
	data?: {
		message: string;
		surveyId?: number;
		completionDate?: string;
	};
}

export interface ReportFilter {
	academicPeriodId?: number;
	programId?: number;
	commissionId?: number;
	school?: string;
	language?: string;
}

export interface DashboardOutcome {
	outcomeId: number;
	outcomeCode?: string;
	outcomeName: string;
	averageScore: number;
	color: DashboardColor;
	totalResponses: number;
}

export interface DashboardSummary {
	totalSurveys: number;
	red?: number;
	yellow?: number;
	green?: number;
	completed?: number;
	pending?: number;
	completionRatePct?: number;
}

export interface DashboardResponse {
	summary: DashboardSummary;
	outcomes?: DashboardOutcome[];
	byProgram?: unknown[];
	byCourse?: unknown[];
	filters?: unknown;
}

export interface ReportPDFFile {
	fileName: string;
	base64Content: string;
}

export interface SurveyApiResponse<T = unknown> {
	success: boolean;
	data?: {
		resource?: T;
		pageInfo?: PageInfo;
	};
	message?: string;
}
