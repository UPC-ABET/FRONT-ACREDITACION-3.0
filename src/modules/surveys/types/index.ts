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
	nombre: string;
	codigo?: string;
}

export interface Program {
	id: number;
	nombre: string;
	codigo?: string;
}

// ─── Competences (PPP / GRA) ───────────────────────────────────────────────
export interface CompetenceConfig {
	id: number;
	outcomeId?: number;
	generalCompetence: string;  // maps to extra.name_es
	specificCompetence: string; // maps to extra.name_en
	description: string;        // maps to extra.description_es
	performanceLevel: number;   // maps to extra.order
	isActive?: boolean;
	programId?: number;
	periodId?: number;
}

export interface CompetenceFormData {
	id: number;
	outcome_id?: number;
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
	level: number;       // maps to performance_level unique_value
	description: string; // maps to performance_level name.es
	range: string;       // derived from min_score – max_score
	minScore?: number;
	maxScore?: number;
	color?: string;      // maps to performance_level extra.color
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
		enviados: number;
		fallidos: number;
		detallesFallo?: Array<{ idEstudiante: number; razon: string }>;
	};
	message?: string;
}

// ─── GRA Email Send (new backend) ─────────────────────────────────────────
export interface GRAEmailSendRequest {
	academicPeriodId: number;
	programId: number;
	surveyBaseUrl: string;
}

// ─── LCFC ──────────────────────────────────────────────────────────────────
export interface LCFCCourse {
	idCurso: number;
	nombreCurso: string;
	codigo: string;
	isActive?: boolean;
	comisiones: Array<{
		idComision: number;
		nombreComision: string;
		profesor?: string;
	}>;
}

export interface LCFCStudent {
	idAlumno: number;
	codigo: string;
	nombre: string;
	email: string;
	encuestaEnviada: boolean;
	encuestaCompletada: boolean;
}

export interface LCFCEmailParam {
	nombre: string;
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
	idConfiguracion?: number;
	idCurso?: number;
	nombreCurso?: string;
	estado?: 'ACTIVO' | 'INACTIVO';
	comisiones?: Array<{ idComision: number; nombreComision: string }>;
}

// ─── Student Survey (token-based access) ──────────────────────────────────
export interface SurveyOutcome {
	outcomeId: number;
	comisionId: number;
	competenciaGeneral?: string;
	competenciaEspecifica: string;
	descripcion: string;
	desempeno: number | null;
	tipoRespuesta?: string;
	pesaje?: number;
}

export interface SurveyCommissionGroup {
	comisionNombre: string;
	comisionId: number;
	outcomes: SurveyOutcome[];
}

export interface SurveyTokenVerification {
	token?: string;
	escuela: string;
	escuelaId?: number;
	nombreEscuela?: string;
	nombreCarrera: string;
	ciclo: string;
	codigoEstudiante?: string;
	codigo?: string;
	nombreEstudiante?: string;
	nombreCurso?: string;
	cursoCodigo?: string;
	estado: boolean; // false = not answered yet, true = already answered
	alumnoId: number;
	encuestaId: number;
	tokenValido?: boolean;
	diasRestantes?: number;
	surveyId?: number;
}

export interface SurveyOutcomesResponse {
	escuela: string;
	nombreEscuela?: string;
	nombreCarrera: string;
	ciclo: string;
	nombreCurso?: string;
	cursoCodigo?: string;
	encuestaId: number;
	lista: SurveyCommissionGroup[];
}

export interface SurveySubmitItem {
	comisionId: number;
	outcomeId: number;
	puntaje: number;
	descripcion?: string;
}

export interface SurveySubmitRequest {
	token?: string;
	comentario: string;
	encuestaId: number;
	escuela: string;
	lista: SurveySubmitItem[];
}

export interface SurveySubmitResponse {
	success: boolean;
	data?: {
		message: string;
		encuestaId?: number;
		fechaCompletacion?: string;
	};
}

// ─── Reports / Dashboard ───────────────────────────────────────────────────
export interface ReportFilter {
	idPeriodoAcademico?: number;
	idCarrera?: number;
	idComision?: number;
	escuela?: string;
	idioma?: string;
}

export interface DashboardOutcome {
	outcomeId: number;
	outcomeCode?: string;
	outcomeName: string;
	averageScore: number;
	color: 'ROJO' | 'AMARILLO' | 'VERDE';
	totalResponses: number;
}

export interface DashboardSummary {
	totalSurveys: number;
	rojo?: number;
	amarillo?: number;
	verde?: number;
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
