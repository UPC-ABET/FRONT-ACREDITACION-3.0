import {
	apiPost,
	apiGet,
	apiDelete,
	apiPostBlob,
	triggerBlobDownload,
	fileToBase64,
	ApiError,
} from '@/shared/lib';
import { getSurveyTypeId } from './academicService';
import type {
	CompetenceConfig,
	CompetenceFormData,
	GRAStudent,
	StudentSearchResult,
	GRAEmailSendRequest,
	SendEmailResponse,
	SurveyApiResponse,
	DashboardResponse,
	AcceptanceLevel,
} from '../types';

// ─── Internal backend shapes ───────────────────────────────────────────────

interface BackendGraConfig {
	id: number;
	outcomeId: number;
	isActive: boolean;
	extra?: {
		surveyType?: string;
		nameEs?: string;
		nameEn?: string;
		descriptionEs?: string;
		order?: number;
		programId?: number;
		academicPeriodId?: number;
		commissionId?: number;
	};
	userOutcomeName?: string;
}

interface BackendGraStudent {
	notificationId: number;
	studentId: number;
	studentCode: string;
	studentName: string;
	studentEmail?: string;
	programId?: number;
	campusId?: number;
	status: string;
	maxRegisterDate?: string;
	surveyId?: number;
}

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptGraConfig(raw: BackendGraConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcomeId,
		competenciaGeneral: extra.nameEs ?? raw.userOutcomeName ?? '',
		competenciaEspecifica: extra.nameEn ?? extra.nameEs ?? '',
		descripcion: extra.descriptionEs ?? '',
		nivelAceptacion: extra.order ?? 3,
		isActive: raw.isActive,
		estado: raw.isActive ? 'ACTIVO' : 'INACTIVO',
		idCarrera: extra.programId,
		idPeriodo: extra.academicPeriodId,
	};
}

function adaptGraStudent(raw: BackendGraStudent): GRAStudent {
	return {
		idNotificacion: raw.notificationId,
		idEstudiante: raw.studentId,
		codigoEstudiante: raw.studentCode,
		nombreEstudiante: raw.studentName,
		emailEstudiante: raw.studentEmail ?? '',
		estadoEnvio: raw.status,
		fechaEnvio: undefined,
	};
}

// ─── Competences ───────────────────────────────────────────────────────────

export async function listGRACompetences(
	academicPeriodId: number,
	programId = 0,
): Promise<CompetenceConfig[]> {
	const res = await apiPost<BackendGraConfig[] | { data?: BackendGraConfig[] }>(
		'gra/config/get-by-filters',
		{ programId: programId || undefined, academicPeriodId, isActive: true },
	);
	const obj = res as { data?: BackendGraConfig[] };
	const list = Array.isArray(res) ? res : (obj.data ?? []);
	return list.map((c) => adaptGraConfig(c));
}

export async function saveGRACompetence(data: CompetenceFormData) {
	const isNew = !data.id || data.id === 0;

	if (isNew) {
		return apiPost('gra/config/create', {
			outcomeId: data.outcomeId ?? 1,
			nameEs: data.competenciaGeneral,
			nameEn: data.competenciaEspecifica || data.competenciaGeneral,
			descriptionEs: data.descripcion,
			descriptionEn: data.descripcion,
			order: data.nivelAceptacion,
			programId: data.idCarrera ?? 0,
			academicPeriodId: data.idPeriodoAcademico,
			isVisible: true,
		});
	}

	return apiPost(`gra/config/update/${data.id}`, {
		nameEs: data.competenciaGeneral,
		nameEn: data.competenciaEspecifica || data.competenciaGeneral,
		descriptionEs: data.descripcion,
		descriptionEn: data.descripcion,
		order: data.nivelAceptacion,
		isVisible: true,
	});
}

export async function deleteGRACompetence(id: number) {
	return apiDelete(`gra/config/delete/${id}`);
}

export async function cloneGRAConfiguration(params: {
	idCarreraOrigen: number;
	idPeriodoOrigen: number;
	idCarreraDestino: number;
	idPeriodoDestino: number;
}) {
	return apiPost('gra/config/replicate', {
		sourceAcademicPeriodId: params.idPeriodoOrigen,
		targetAcademicPeriodId: params.idPeriodoDestino,
		programId: params.idCarreraDestino,
	});
}

// ─── GRA Outcomes (for dropdown selection) ─────────────────────────────────

export async function listGRAOutcomes(params: { programId: number; academicPeriodId: number }) {
	return apiPost<
		Array<{
			commissionId: number;
			commissionName: string;
			outcomes: Array<{ outcomeId: number; outcomeCode: string; outcomeName: string }>;
		}>
	>('gra/outcomes/list', params);
}

// ─── Acceptance levels (shared with PPP) ──────────────────────────────────

export async function listGRAAcceptanceLevels(
	academicPeriodId: number,
): Promise<AcceptanceLevel[]> {
	const surveyTypeId = await getSurveyTypeId('GRA');
	const res = await apiPost<
		Array<{
			id: number;
			minScore: number;
			maxScore: number;
			name: { es?: string };
			color?: string;
			order?: number;
		}>
	>('acceptance-levels/list', {
		surveyTypeCode: 'GRA',
		...(surveyTypeId > 0 && { surveyTypeId }),
		academicPeriodId,
	});
	const list = Array.isArray(res) ? res : [];
	return list.map((l, i) => ({
		id: l.id,
		nivel: l.order ?? i + 1,
		descripcion: l.name?.es ?? `Nivel ${i + 1}`,
		rango: `${l.minScore} – ${l.maxScore}`,
		minScore: l.minScore,
		maxScore: l.maxScore,
		color: l.color,
	}));
}

// ─── Students / Notifications ──────────────────────────────────────────────

export async function searchStudentByCode(
	codigoEstudiante: string,
	idCarrera: number,
): Promise<StudentSearchResult> {
	const res = await apiPost<SurveyApiResponse<StudentSearchResult>>(
		'email/findStudentCode-career-GRA',
		{ codigoEstudiante, idCarrera },
	);
	return res.data?.resource as StudentSearchResult;
}

export async function addStudentToNotification(params: {
	studentId: number;
	programId: number;
	academicPeriodId: number;
	campusId?: number;
	maxRegisterDate?: string;
}) {
	return apiPost('gra/notification/save', {
		studentId: params.studentId,
		programId: params.programId,
		academicPeriodId: params.academicPeriodId,
		campusId: params.campusId ?? 0,
		maxRegisterDate:
			params.maxRegisterDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	});
}

export async function deleteStudentNotification(notificationId: number) {
	return apiDelete(`gra/notification/delete/${notificationId}`);
}

export async function listGRAStudents(params: {
	programId?: number;
	academicPeriodId?: number;
	campusId?: number;
	studentCode?: string;
}): Promise<{ students: GRAStudent[] }> {
	const res = await apiPost<BackendGraStudent[] | { data?: BackendGraStudent[] }>(
		'gra/notification/list-students',
		params,
	);
	const obj = res as { data?: BackendGraStudent[] };
	const list = Array.isArray(res) ? res : (obj.data ?? []);
	return { students: list.map((s) => adaptGraStudent(s)) };
}

// ─── Email sending ─────────────────────────────────────────────────────────

export async function sendGRAEmail(request: GRAEmailSendRequest): Promise<SendEmailResponse> {
	const res = await apiPost<{ success: boolean; enviados?: number; fallidos?: number }>(
		'gra/email/send',
		request,
	);
	return {
		success: res.success,
		data: { enviados: res.enviados ?? 0, fallidos: res.fallidos ?? 0 },
	};
}

// Legacy email functions (kept while backend migrates)
export async function getGRAEmailTemplate(idEncuesta: number) {
	const res = await apiPost<SurveyApiResponse<{ asunto: string; cuerpo: string }>>(
		'email/getConfigurationNotification-GRA',
		{ idEncuesta },
	);
	return res.data?.resource ?? { asunto: '', cuerpo: '' };
}

export async function saveGRAEmailTemplate(template: {
	idEncuesta?: number;
	asunto: string;
	cuerpo: string;
}) {
	return apiPost('email/saveConfirmationNotif-GRA', template);
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadGRATemplate(_idPeriodoAcademico: number): Promise<void> {
	throw new ApiError(
		'La descarga de plantilla GRA no está disponible en esta versión del backend.',
	);
}

export async function uploadGRAMassive(file: File, _escuelaActual?: unknown): Promise<void> {
	const archivoBase64 = await fileToBase64(file);
	const blob = await apiPostBlob('excel/uploadNotificationEncuesta-GRA', {
		archivoBase64,
		nombreArchivo: file.name,
	});
	triggerBlobDownload(blob, `Reporte_Carga_GRA_${Date.now()}.xlsx`);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function generateGRADashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
}): Promise<DashboardResponse> {
	return apiPost<DashboardResponse>('gra/dashboard', params);
}

export async function generateGRAPerceptionReport(params: {
	idPeriodoAcademico?: number;
	idCarrera?: number;
	idComision?: number;
}) {
	return generateGRADashboard({
		academicPeriodId: params.idPeriodoAcademico,
		programId: params.idCarrera,
	});
}

// ─── GRA token & survey (admin read) ──────────────────────────────────────

export async function validateGRAToken(token: string) {
	return apiGet(`gra/token/validate/${encodeURIComponent(token)}`);
}
