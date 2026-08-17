import type { I18nText } from '@/shared/types';

export type SurveyType = 'PPP' | 'GRA' | 'LCFC';

export interface OptionItem {
	value: string | number;
	label: string;
}

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
	/** Commission type code (TG301-T001 General / TG301-T002 Especifica) of the linked outcome,
	 * resolved server-side. Undefined when the config has no outcome linked. */
	commissionTypeCode?: string;
	generalCompetence: string;
	specificCompetence: string;
	description: string;
	descriptionEn?: string;
	performanceLevel: number;
	isActive?: boolean;
	isVisible?: boolean;
	/** Server-side flag with no UI left to edit it. Read from `extra.isExternal` and sent back
	 *  unchanged on save so editing a competence can't silently reset a stored `true`. */
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
	/** Carried through the form untouched — see `CompetenceConfig.isExternal`. */
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
	/** The student's own program id — the add flow uses it instead of the UI career filter. */
	programId?: number | null;
	career: string;
	cycle?: string;
	sections?: string[];
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
	/** Base64 xlsx (same file + an "Errores" column) — present only when `failed > 0`. */
	excelWithErrors?: string | null;
	/** Suggested file name for `excelWithErrors`. */
	fileName?: string | null;
}

/** Real-time progress of a PPP bulk-upload job (polled from `ppp/survey/upload-status/:jobId`).
 *  `progressPct` reflects rows actually validated/saved server-side — never simulated. */
export interface PPPUploadJobStatus {
	progressPct: number;
	totalRows: number;
	processedRows: number;
	done: boolean;
	result: MassiveUploadResult | null;
}

export interface GRAEmailSendRequest {
	academicPeriodId: number;
	programId: number;
	surveyBaseUrl: string;
	/** "Reenviar a quienes ya recibieron" — also resends to already-notified, unanswered students. */
	resend?: boolean;
}

export interface GRASendResponse {
	accepted: boolean;
	jobId: string;
}

export interface GRANotificationJobStatus {
	progressPct: number;
	totalStudents: number;
	emailsSent: number;
	emailsFailed: number;
	errors: string[];
}

export interface GRASendSummaryByProgram {
	programId: number;
	programName: string;
	studentCount: number;
}

export interface GRASendSummary {
	totalPrograms: number;
	totalStudents: number;
	byProgram: GRASendSummaryByProgram[];
}

export type LCFCConfigStatus = 'ACTIVE' | 'INACTIVE';

export interface AvailableSection {
	courseSectionId: number;
	courseId: number;
	courseName: string;
	sectionCode: string;
	campusId: number;
}
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
	courseSectionId?: number;
	sectionCode?: string;
	maxRegisterDate?: string;
	commissionId?: number;
}

/** Lean row from lcfc/config/list-sections — just what the notifications section table renders. */
export interface LCFCSectionSummary {
	id: number;
	courseName: string;
	sectionCode: string;
	courseSectionId?: number;
	isActive: boolean;
}

/** Server-paginated page of section summaries (mirrors the backend PaginatedResult shape). */
export interface LCFCSectionPage {
	items: LCFCSectionSummary[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface BackendLcfcSectionRow {
	id: number;
	courseName?: string | { es?: string; en?: string };
	sectionCode?: string | null;
	courseSectionId?: number | null;
	isActive: boolean;
}

export interface LCFCConfigUpdateRequest {
	userOutcomeName?: I18nText;
	userOutcomeDescription?: I18nText;
	isActive?: boolean;
	outcomeId?: number;
	commissionId?: number;
}

export interface LCFCSectionOutcome {
	outcomeId: number;
	code: string;
	name: string;
}

export interface LCFCSectionCommission {
	commissionId: number;
	code: string;
	name: string;
	typeCode?: string;
	typeName?: string;
}

export interface LCFCStudentSurveyItem {
	token: string;
	courseName: string;
	sectionCode: string;
	completed: boolean;
	surveyType: 'LCFC' | 'GRA';
}

export interface LCFCStudentSurveys {
	studentName: string;
	studentCode: string;
	programName: string;
	period: string;
	surveys: LCFCStudentSurveyItem[];
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
	programId?: number;
	campusId?: number;
	courseSectionId?: number;
	maxRegisterDate?: string;
	surveyBaseUrl: string;
	resend?: boolean;
}

export interface LCFCNotificationSendResponse {
	accepted: boolean;
	jobId: string;
}

export interface LCFCNotificationJobStatus {
	progressPct: number;
	emailsSent: number;
	emailsFailed: number;
	skippedAlreadySent?: number;
	skippedAlreadyCompleted?: number;
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
	code?: string;
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

export interface PerceptionReportFile {
	campusId: number | null;
	campusName: string;
	filename: string;
	base64: string;
}

export interface PerceptionReportResponse {
	reports: PerceptionReportFile[];
	zip: { filename: string; base64: string } | null;
}

export interface PerceptionReportFilters {
	commissionId?: number;
	campusId?: number;
	surveyNumbers?: number[];
	lang?: 'es' | 'en';
}

export interface SurveyApiResponse<T = unknown> {
	success: boolean;
	data?: {
		resource?: T;
		pageInfo?: PageInfo;
	};
	message?: string;
}

export type I18nOrString = string | { es?: string; en?: string } | null | undefined;

export interface ProgramOutcome {
	outcomeId: number;
	outcomeCode: string;
	outcomeName: I18nOrString;
	outcomeDescription?: I18nOrString;
}

export interface GenerateConfigResult {
	created: number;
	skipped: number;
}

export interface CloneConfigResult {
	generated: number;
	skipped: number;
	statusCopied: number;
	sourcePeriodId: number;
}

export interface BackendTokenValidation {
	surveyId?: number;
	surveyStatus?: string;
	studentId?: number;
	studentCode?: string;
	studentName?: string;
	studentEmail?: string;
	programId?: number;
	programName?: string;
	campusId?: number;
	courseSectionId?: number;
	courseName?: string;
	courseCode?: string;
	academicPeriod?: string;
	period?: string;
	school?: string;
	schoolName?: string;
	isCompleted?: boolean;
	completed?: boolean;
}

export interface BackendOutcome {
	outcomeConfigId?: number;
	outcomeId?: number;
	commissionId?: number;
	commissionName?: string;
	code?: string;
	name?: string;
	specificCompetence?: string;
	generalCompetence?: string;
	description?: string;
	order?: number;
}

export interface BackendOutcomesPayload {
	school?: string;
	schoolName?: string;
	programName?: string;
	period?: string;
	courseName?: string;
	courseCode?: string;
	surveyId?: number;
	items?: BackendOutcome[];
	outcomes?: BackendOutcome[];
	scores?: BackendOutcome[];
	list?: BackendOutcome[];
}

export interface BackendPppConfig {
	id: number;
	outcomeId: number;
	isActive: boolean;
	isVisible?: boolean;
	extra?: {
		surveyType?: string;
		nameEs?: string;
		nameEn?: string;
		descriptionEs?: string;
		descriptionEn?: string;
		order?: number;
		programId?: number;
		academicPeriodId?: number;
		isExternal?: boolean;
	};
	userOutcomeName?: string;
	userOutcomeDescription?: string;
	outcomeCode?: string;
	outcome?: { programCommission?: { commissionType?: { code?: string } } };
}

export interface BackendUploadResult {
	total?: number;
	success?: number;
	failed?: number;
	// PPP's uploadExcel returns plain "Row N: message" strings; other upload endpoints
	// return structured objects — accept either.
	errors?: Array<string | { row?: number; code?: string; reason?: string; message?: string }>;
	excelWithErrors?: string | null;
	fileName?: string | null;
}

export interface BackendLcfcConfig {
	id: number;
	outcomeId: number;
	userOutcomeName?: string | I18nText;
	userOutcomeDescription?: string | I18nText;
	isActive: boolean;
	extra?: {
		surveyType?: string;
		courseSectionId?: number;
		courseId?: number;
		courseName?: string | I18nText;
		sectionCode?: string;
		academicPeriodId?: number;
		programId?: number;
		campusId?: number;
		maxRegisterDate?: string;
		commissionId?: number;
	};
}

export interface BackendGenerateResult {
	created: number;
	skipped: number;
	configs: Array<BackendLcfcConfig & { _status: 'created' | 'skipped' }>;
}

export interface BackendGraConfig {
	id: number;
	outcomeId: number;
	isActive: boolean;
	isVisible?: boolean;
	extra?: {
		surveyType?: string;
		nameEs?: string;
		nameEn?: string;
		descriptionEs?: string;
		descriptionEn?: string;
		order?: number;
		programId?: number;
		academicPeriodId?: number;
		commissionId?: number;
		isExternal?: boolean;
	};
	// jsonb I18nText columns that in practice hold a bare ES string
	userOutcomeName?: string | { es?: string; en?: string };
	userOutcomeDescription?: string | { es?: string; en?: string };
	outcome?: { programCommission?: { commissionType?: { code?: string } } };
}

export interface BackendGraStudent {
	notificationId: number;
	studentId: number;
	studentCode: string;
	studentName: string;
	studentEmail?: string;
	programId?: number;
	campusId?: number;
	/** Localized display name of the notification status (e.g. "Enviada") — don't compare against it */
	notificationStatus?: string;
	/** Stable core.types code (TG1001-T001 scheduled / TG1001-T002 sent) */
	notificationStatusCode?: string;
	sentDate?: string;
	responseStatus?: string;
	responseDate?: string;
	maxRegisterDate?: string;
	surveyId?: number;
}

export interface BackendStudent {
	id: number;
	code?: string;
	studentCode?: string;
	name?: string | { es?: string; en?: string };
	fullName?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	programName?: string;
	programId?: number;
	sections?: string[];
}

export interface BackendEmailTemplate {
	code?: string;
	name?: string | { es?: string; en?: string };
	subject?: string | { es?: string; en?: string };
	body?: string | { es?: string; en?: string };
}

export interface BackendEntity {
	id: number;
	code?: string;
	codigo?: string;
	name?: string | { es?: string; en?: string };
	nombre?: string;
	isActive?: boolean;
}

export type Envelope<T> = T[] | { data?: T[] };
