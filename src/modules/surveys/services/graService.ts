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
	EmailTemplate,
	GRAEmailSendRequest,
	SendEmailResponse,
	SurveyApiResponse,
	DashboardResponse,
	PerformanceLevel,
} from '../types';

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

interface BackendStudentSearchRequest {
	codigoEstudiante: string;
	idCarrera: number;
}

interface BackendStudentSearchResponse {
	idEstudiante: number;
	codigo: string;
	nombre: string;
	email: string;
	carrera: string;
	ciclo?: string;
}

interface BackendEmailTemplate {
	asunto: string;
	cuerpo: string;
}

interface BackendGetEmailTemplateRequest {
	idEncuesta: number;
}

interface BackendSaveEmailTemplateRequest {
	idEncuesta: number | undefined;
	asunto: string;
	cuerpo: string;
}

function adaptGraConfig(raw: BackendGraConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcomeId,
		generalCompetence: extra.nameEs ?? raw.userOutcomeName ?? '',
		specificCompetence: extra.nameEn ?? extra.nameEs ?? '',
		description: extra.descriptionEs ?? '',
		performanceLevel: extra.order ?? 3,
		isActive: raw.isActive,
		programId: extra.programId,
		periodId: extra.academicPeriodId,
	};
}

function adaptGraStudent(raw: BackendGraStudent): GRAStudent {
	return {
		notificationId: raw.notificationId,
		studentId: raw.studentId,
		studentCode: raw.studentCode,
		studentName: raw.studentName,
		studentEmail: raw.studentEmail ?? '',
		sendStatus: raw.status,
		sendDate: undefined,
	};
}

function adaptPerformanceLevel(raw: PerformanceLevelResponse, index: number): PerformanceLevel {
	const nameEs = raw.name?.es ?? `Level ${index + 1}`;
	const color = raw.extra && typeof raw.extra.color === 'string' ? raw.extra.color : undefined;
	return {
		id: raw.id,
		level: Number(raw.uniqueValue) || index + 1,
		description: nameEs,
		range: `${raw.minScore} – ${raw.maxScore}`,
		minScore: Number(raw.minScore),
		maxScore: Number(raw.maxScore),
		color,
	};
}

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
			nameEs: data.generalCompetence,
			nameEn: data.specificCompetence || data.generalCompetence,
			descriptionEs: data.description,
			descriptionEn: data.description,
			order: data.performanceLevel,
			programId: data.programId ?? 0,
			academicPeriodId: data.academicPeriodId,
			isVisible: true,
		});
	}

	return apiPost(`gra/config/update/${data.id}`, {
		nameEs: data.generalCompetence,
		nameEn: data.specificCompetence || data.generalCompetence,
		descriptionEs: data.description,
		descriptionEn: data.description,
		order: data.performanceLevel,
		isVisible: true,
	});
}

export async function deleteGRACompetence(id: number) {
	return apiDelete(`gra/config/delete/${id}`);
}

export async function cloneGRAConfiguration(params: {
	sourceProgramId: number;
	sourcePeriodId: number;
	targetProgramId: number;
	targetPeriodId: number;
}) {
	return apiPost('gra/config/replicate', {
		sourceAcademicPeriodId: params.sourcePeriodId,
		targetAcademicPeriodId: params.targetPeriodId,
		programId: params.targetProgramId,
	});
}

export async function listGRAOutcomes(params: { programId: number; academicPeriodId: number }) {
	return apiPost<
		Array<{
			commissionId: number;
			commissionName: string;
			outcomes: Array<{ outcomeId: number; outcomeCode: string; outcomeName: string }>;
		}>
	>('gra/outcomes/list', params);
}

export async function listGRAPerformanceLevels(
	academicPeriodId: number,
): Promise<PerformanceLevel[]> {
	const instrumentTypeId = await getSurveyTypeId('GRA');
	const res = await performanceLevelsService.getByFilters({
		...(instrumentTypeId > 0 && { instrumentTypeId }),
		academicPeriodId,
		isActive: true,
	});
	const list = res?.data ?? [];
	return list.map((l, i) => adaptPerformanceLevel(l, i));
}

export async function searchStudentByCode(
	studentCode: string,
	programId: number,
): Promise<StudentSearchResult> {
	const payload: BackendStudentSearchRequest = {
		codigoEstudiante: studentCode,
		idCarrera: programId,
	};
	const res = await apiPost<SurveyApiResponse<BackendStudentSearchResponse>>(
		'email/findStudentCode-career-GRA',
		payload,
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

interface BackendSendEmailResponse {
	success: boolean;
	enviados?: number;
	fallidos?: number;
}

export async function sendGRAEmail(request: GRAEmailSendRequest): Promise<SendEmailResponse> {
	const res = await apiPost<BackendSendEmailResponse>('gra/email/send', request);
	return {
		success: res.success,
		data: { sent: res.enviados ?? 0, failed: res.fallidos ?? 0 },
	};
}

export async function getGRAEmailTemplate(surveyId: number): Promise<EmailTemplate> {
	const req: BackendGetEmailTemplateRequest = { idEncuesta: surveyId };
	const res = await apiPost<SurveyApiResponse<BackendEmailTemplate>>(
		'email/getConfigurationNotification-GRA',
		req,
	);
	const raw = res.data?.resource ?? { asunto: '', cuerpo: '' };
	return { subject: raw.asunto, body: raw.cuerpo };
}

export async function saveGRAEmailTemplate(template: {
	surveyId?: number;
	subject: string;
	body: string;
}) {
	const req: BackendSaveEmailTemplateRequest = {
		idEncuesta: template.surveyId,
		asunto: template.subject,
		cuerpo: template.body,
	};
	return apiPost('email/saveConfirmationNotif-GRA', req);
}

export async function downloadGRATemplate(_periodId: number): Promise<void> {
	throw new ApiError('GRA template download is not available in this backend version.');
}

export async function uploadGRAMassive(file: File, _school?: unknown): Promise<void> {
	const fileBase64 = await fileToBase64(file);
	const blob = await apiPostBlob('excel/uploadNotificationEncuesta-GRA', {
		archivoBase64: fileBase64,
		nombreArchivo: file.name,
	});
	triggerBlobDownload(blob, `GRA_Upload_Report_${Date.now()}.xlsx`);
}

export async function generateGRADashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
}): Promise<DashboardResponse> {
	return apiPost<DashboardResponse>('gra/dashboard', params);
}

export async function generateGRAPerceptionReport(params: {
	academicPeriodId?: number;
	programId?: number;
	commissionId?: number;
}) {
	return generateGRADashboard({
		academicPeriodId: params.academicPeriodId,
		programId: params.programId,
	});
}

// Backend requires POST for token validation (GET is not exposed on this route).
export async function validateGRAToken(token: string) {
	return apiPost(`gra/token/validate/${encodeURIComponent(token)}`, {});
}
