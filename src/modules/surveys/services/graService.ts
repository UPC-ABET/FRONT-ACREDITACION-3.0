import {
	apiPost,
	apiDelete,
	apiPostBlob,
	triggerBlobDownload,
	fileToBase64,
	ApiError,
} from '@/shared/lib';
import { getSurveyTypeId } from './academicService';
import { performanceLevelsService } from '@/modules/academic/services/performanceLevelsService';
import type { PerformanceLevelResponse } from '@/modules/academic/types';
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
	outcome_id: number;
	is_active: boolean;
	extra?: {
		survey_type?: string;
		name_es?: string;
		name_en?: string;
		description_es?: string;
		order?: number;
		program_id?: number;
		academic_period_id?: number;
		commission_id?: number;
	};
	user_outcome_name?: string;
}

interface BackendGraStudent {
	notification_id: number;
	student_id: number;
	student_code: string;
	student_name: string;
	student_email?: string;
	program_id?: number;
	campus_id?: number;
	status: string;
	max_register_date?: string;
	survey_id?: number;
}

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptGraConfig(raw: BackendGraConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcome_id,
		generalCompetence: extra.name_es ?? raw.user_outcome_name ?? '',
		specificCompetence: extra.name_en ?? extra.name_es ?? '',
		description: extra.description_es ?? '',
		acceptanceLevel: extra.order ?? 3,
		isActive: raw.is_active,
		estado: raw.is_active ? 'ACTIVO' : 'INACTIVO',
		programId: extra.program_id,
		periodId: extra.academic_period_id,
	};
}

function adaptGraStudent(raw: BackendGraStudent): GRAStudent {
	return {
		notificationId: raw.notification_id,
		studentId: raw.student_id,
		studentCode: raw.student_code,
		studentName: raw.student_name,
		studentEmail: raw.student_email ?? '',
		sendStatus: raw.status,
		sendDate: undefined,
	};
}

function adaptPerformanceLevel(raw: PerformanceLevelResponse, index: number): AcceptanceLevel {
	const nameEs = raw.name?.es ?? `Level ${index + 1}`;
	const color =
		raw.extra && typeof raw.extra.color === 'string' ? raw.extra.color : undefined;
	return {
		id: raw.id,
		level: Number(raw.unique_value) || index + 1,
		description: nameEs,
		range: `${raw.min_score} – ${raw.max_score}`,
		minScore: Number(raw.min_score),
		maxScore: Number(raw.max_score),
		color,
	};
}

// ─── Competences ───────────────────────────────────────────────────────────

export async function listGRACompetences(
	academic_period_id: number,
	program_id = 0,
): Promise<CompetenceConfig[]> {
	const res = await apiPost<BackendGraConfig[] | { data?: BackendGraConfig[] }>(
		'gra/config/get-by-filters',
		{ program_id: program_id || undefined, academic_period_id, is_active: true },
	);
	const obj = res as { data?: BackendGraConfig[] };
	const list = Array.isArray(res) ? res : (obj.data ?? []);
	return list.map((c) => adaptGraConfig(c));
}

export async function saveGRACompetence(data: CompetenceFormData) {
	const isNew = !data.id || data.id === 0;

	if (isNew) {
		return apiPost('gra/config/create', {
			outcome_id: data.outcome_id ?? 1,
			name_es: data.generalCompetence,
			name_en: data.specificCompetence || data.generalCompetence,
			description_es: data.description,
			description_en: data.description,
			order: data.acceptanceLevel,
			program_id: data.programId ?? 0,
			academic_period_id: data.academicPeriodId,
			is_visible: true,
		});
	}

	return apiPost(`gra/config/update/${data.id}`, {
		name_es: data.generalCompetence,
		name_en: data.specificCompetence || data.generalCompetence,
		description_es: data.description,
		description_en: data.description,
		order: data.acceptanceLevel,
		is_visible: true,
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
		source_academic_period_id: params.idPeriodoOrigen,
		target_academic_period_id: params.idPeriodoDestino,
		program_id: params.idCarreraDestino,
	});
}

// ─── GRA Outcomes (for dropdown selection) ─────────────────────────────────

export async function listGRAOutcomes(params: { program_id: number; academic_period_id: number }) {
	return apiPost<
		Array<{
			commission_id: number;
			commission_name: string;
			outcomes: Array<{ outcome_id: number; outcome_code: string; outcome_name: string }>;
		}>
	>('gra/outcomes/list', params);
}

// ─── Performance levels (replaces acceptance_levels) ──────────────────────
// instrument_type_id = GRA survey type from TG601; order and color in extra.

export async function listGRAAcceptanceLevels(
	academic_period_id: number,
): Promise<AcceptanceLevel[]> {
	const instrument_type_id = await getSurveyTypeId('GRA');
	const res = await performanceLevelsService.getByFilters({
		...(instrument_type_id > 0 && { instrument_type_id }),
		academic_period_id,
		is_active: true,
	});
	const list = res?.data ?? [];
	return list.map((l, i) => adaptPerformanceLevel(l, i));
}

// ─── Students / Notifications ──────────────────────────────────────────────

export async function searchStudentByCode(
	codigoEstudiante: string,
	idCarrera: number,
): Promise<StudentSearchResult> {
	const res = await apiPost<SurveyApiResponse<{
		idEstudiante: number;
		codigo: string;
		nombre: string;
		email: string;
		carrera: string;
		ciclo?: string;
	}>>(
		'email/findStudentCode-career-GRA',
		{ codigoEstudiante, idCarrera },
	);
	const raw = res.data?.resource;
	return {
		studentId: raw?.idEstudiante ?? 0,
		code: raw?.codigo ?? '',
		name: raw?.nombre ?? '',
		email: raw?.email ?? '',
		career: raw?.carrera ?? '',
		cycle: raw?.ciclo,
	};
}

export async function addStudentToNotification(params: {
	student_id: number;
	program_id: number;
	academic_period_id: number;
	campus_id?: number;
	max_register_date?: string;
}) {
	return apiPost('gra/notification/save', {
		student_id: params.student_id,
		program_id: params.program_id,
		academic_period_id: params.academic_period_id,
		campus_id: params.campus_id ?? 0,
		max_register_date:
			params.max_register_date ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	});
}

export async function deleteStudentNotification(notificationId: number) {
	return apiDelete(`gra/notification/delete/${notificationId}`);
}

export async function listGRAStudents(params: {
	program_id?: number;
	academic_period_id?: number;
	campus_id?: number;
	student_code?: string;
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
		'GRA template download is not available in this backend version.',
	);
}

export async function uploadGRAMassive(file: File, _escuelaActual?: unknown): Promise<void> {
	const archivoBase64 = await fileToBase64(file);
	const blob = await apiPostBlob('excel/uploadNotificationEncuesta-GRA', {
		archivoBase64,
		nombreArchivo: file.name,
	});
	triggerBlobDownload(blob, `GRA_Upload_Report_${Date.now()}.xlsx`);
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function generateGRADashboard(params: {
	academic_period_id?: number;
	program_id?: number;
	campus_id?: number;
}): Promise<DashboardResponse> {
	return apiPost<DashboardResponse>('gra/dashboard', params);
}

export async function generateGRAPerceptionReport(params: {
	idPeriodoAcademico?: number;
	idCarrera?: number;
	idComision?: number;
}) {
	return generateGRADashboard({
		academic_period_id: params.idPeriodoAcademico,
		program_id: params.idCarrera,
	});
}

// ─── GRA token & survey (admin read) ──────────────────────────────────────

export async function validateGRAToken(token: string) {
	return apiPost(`gra/token/validate/${encodeURIComponent(token)}`, {});
}
