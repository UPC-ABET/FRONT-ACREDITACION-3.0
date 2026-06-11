// ─── Survey type identifiers ───────────────────────────────────────────────
export type SurveyType = 'PPP' | 'GRA' | 'LCFC';

// ─── Common pagination ─────────────────────────────────────────────────────
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

// ─── Academic entities (from academic module) ──────────────────────────────
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

// ─── Competences (PPP / GRA) ───────────────────────────────────────────────
export interface CompetenceConfig {
	id: number;
	outcomeId?: number;
	generalCompetence: string; // maps to extra.name_es
	specificCompetence: string; // maps to extra.name_en
	description: string; // maps to extra.description_es
	performanceLevel: number; // maps to extra.order
	isActive?: boolean;
	programId?: number;
	periodId?: number;
}

export interface CompetenceFormData {
	id: number;
	outcomeId?: number;
	generalCompetence: string;
	specificCompetence: string;
	description: string;
	performanceLevel: number;
	academicPeriodId: number;
	programId?: number;
	school: string;
}

// ─── Performance levels ────────────────────────────────────────────────────
export interface PerformanceLevel {
	id?: number;
	level: number; // maps to performance_level unique_value
	description: string; // maps to performance_level name.es
	range: string; // derived from min_score – max_score
	minScore?: number;
	maxScore?: number;
	color?: string; // maps to performance_level extra.color
}

// ─── File download response ────────────────────────────────────────────────
export interface FileResource {
	fileContents: string;
	contentType: string;
	fileDownloadName: string;
}

// ─── PPP ───────────────────────────────────────────────────────────────────
export interface PPPCloneRequest {
	sourceAcademicPeriodId: number;
	targetAcademicPeriodId: number;
	programId: number;
}

// ─── GRA Student Notification ─────────────────────────────────────────────
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
	subject: string;
	body: string;
	htmlContent?: string;
	templateLanguage?: string;
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

// ─── GRA Email Send (new backend) ─────────────────────────────────────────
export interface GRAEmailSendRequest {
	academicPeriodId: number;
	programId: number;
	surveyBaseUrl: string;
}

// ─── LCFC config status / dashboard color ─────────────────────────────────
export type LCFCConfigStatus = 'ACTIVE' | 'INACTIVE';
export type DashboardColor = 'RED' | 'YELLOW' | 'GREEN';

// ─── LCFC ──────────────────────────────────────────────────────────────────
export interface LCFCCourse {
	courseId: number;
	courseName: string;
	code: string;
	isActive?: boolean;
	commissions: Array<{
		commissionId: number;
		commissionName: string;
		professor?: string;
	}>;
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

// New backend LCFC notification send request
export interface LCFCNotificationSendRequest {
	academicPeriodId: number;
	programId: number;
	campusId?: number;
	courseSectionId?: number;
	maxRegisterDate: string;
	surveyBaseUrl: string;
}

export interface LCFCConfigItem {
	configId?: number;
	courseId?: number;
	courseName?: string;
	status?: LCFCConfigStatus;
	commissions?: Array<{ commissionId: number; commissionName: string }>;
}

// ─── Student Survey (token-based access) ──────────────────────────────────
export interface SurveyOutcome {
	outcomeId: number;
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

// ─── Reports / Dashboard ───────────────────────────────────────────────────
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

// ─── Generic API response ──────────────────────────────────────────────────
export interface SurveyApiResponse<T = unknown> {
	success: boolean;
	data?: {
		resource?: T;
		pageInfo?: PageInfo;
	};
	message?: string;
}
