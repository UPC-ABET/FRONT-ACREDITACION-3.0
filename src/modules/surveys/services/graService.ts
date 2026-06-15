import {
	apiGet,
	apiPost,
	apiPut,
	apiDelete,
	apiGetBlobResponse,
	getApiData,
	triggerBlobDownload,
	resolveDownloadFileName,
	fileToBase64,
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
	DashboardResponse,
	PerformanceLevel,
	MassiveUploadResult,
} from '../types';

interface BackendGraConfig {
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
	sendDate?: string;
	responseStatus?: string;
	responseDate?: string;
	maxRegisterDate?: string;
	surveyId?: number;
}

interface BackendStudent {
	id: number;
	code?: string;
	studentCode?: string;
	name?: string | { es?: string; en?: string };
	fullName?: string;
	email?: string;
	programName?: string;
	programId?: number;
}

interface BackendEmailTemplate {
	code?: string;
	name?: string | { es?: string; en?: string };
	subject?: string | { es?: string; en?: string };
	body?: string | { es?: string; en?: string };
}

interface BackendUploadResult {
	total?: number;
	success?: number;
	failed?: number;
	errors?: Array<{ row?: number; code?: string; reason?: string; message?: string }>;
}

function localized(value: string | { es?: string; en?: string } | undefined, lang = 'es'): string {
	if (value == null) return '';
	if (typeof value === 'string') return value;
	return value[lang as 'es' | 'en'] ?? value.es ?? value.en ?? '';
}

function adaptGraConfig(raw: BackendGraConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcomeId,
		generalCompetence: extra.nameEs ?? raw.userOutcomeName ?? '',
		specificCompetence: extra.nameEn ?? extra.nameEs ?? '',
		description: extra.descriptionEs ?? '',
		descriptionEn: extra.descriptionEn ?? '',
		performanceLevel: extra.order ?? 3,
		isActive: raw.isActive,
		isVisible: raw.isVisible ?? raw.isActive,
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
		sendDate: raw.sendDate,
		responseStatus: raw.responseStatus,
		responseDate: raw.responseDate,
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

function adaptUploadResult(raw: BackendUploadResult): MassiveUploadResult {
	return {
		total: raw.total ?? 0,
		success: raw.success ?? 0,
		failed: raw.failed ?? 0,
		errors: (raw.errors ?? []).map((e) => ({
			row: e.row,
			code: e.code,
			reason: e.reason ?? e.message ?? '',
		})),
	};
}

export async function listGRACompetences(
	academicPeriodId: number,
	programId = 0,
): Promise<CompetenceConfig[]> {
	const res = await apiPost('gra/config/get-by-filters', {
		programId: programId || undefined,
		academicPeriodId,
		isActive: true,
	});
	const list = getApiData<BackendGraConfig[]>(res) ?? [];
	return list.map((c) => adaptGraConfig(c));
}

export async function saveGRACompetence(data: CompetenceFormData) {
	const payload = {
		outcomeId: data.outcomeId ?? 1,
		nameEs: data.generalCompetence,
		nameEn: data.specificCompetence || data.generalCompetence,
		descriptionEs: data.description,
		descriptionEn: data.descriptionEn || data.description,
		order: data.performanceLevel,
		programId: data.programId ?? 0,
		academicPeriodId: data.academicPeriodId,
		isVisible: data.isVisible ?? true,
	};

	if (!data.id || data.id === 0) {
		return apiPost('gra/config/create', payload);
	}
	return apiPut(`gra/config/update/${data.id}`, { ...payload, isActive: true });
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
	const res = await apiPost('gra/outcomes/list', params);
	return (
		getApiData<
			Array<{
				commissionId: number;
				commissionName: string;
				outcomes: Array<{ outcomeId: number; outcomeCode: string; outcomeName: string }>;
			}>
		>(res) ?? []
	);
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
): Promise<StudentSearchResult | null> {
	const res = await apiPost('students/get-by-filters', {
		extra: { code: studentCode },
		programId: programId || undefined,
		isActive: true,
	});
	const list = getApiData<BackendStudent[]>(res) ?? [];
	const match = list.find((s) => (s.code ?? s.studentCode) === studentCode) ?? list[0] ?? null;
	if (!match) return null;
	return {
		studentId: match.id,
		code: match.code ?? match.studentCode ?? studentCode,
		name: match.fullName ?? localized(match.name),
		email: match.email ?? '',
		career: match.programName ?? '',
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
	const res = await apiPost('gra/notification/list-students', params);
	const list = getApiData<BackendGraStudent[]>(res) ?? [];
	return { students: list.map((s) => adaptGraStudent(s)) };
}

export async function sendGRAEmail(
	request: GRAEmailSendRequest,
	lang = 'es',
): Promise<SendEmailResponse> {
	const res = await apiPost('gra/email/send', { ...request, lang });
	const data = getApiData<{ sent?: number; failed?: number }>(res);
	return { success: true, data: { sent: data?.sent ?? 0, failed: data?.failed ?? 0 } };
}

export async function getGRAEmailTemplate(lang = 'es'): Promise<EmailTemplate> {
	const res = await apiGet('gra/email/template');
	const raw = getApiData<BackendEmailTemplate>(res) ?? {};
	return {
		code: raw.code,
		name: localized(raw.name, lang),
		subject: localized(raw.subject, lang),
		body: localized(raw.body, lang),
	};
}

export async function saveGRAEmailTemplate(template: { subject: string; body: string }) {
	return apiPut('gra/email/template', {
		subjectEs: template.subject,
		subjectEn: template.subject,
		bodyEs: template.body,
		bodyEn: template.body,
	});
}

export async function downloadGRATemplate(): Promise<void> {
	const { blob, response } = await apiGetBlobResponse('gra/notification/template');
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'GRA_Notification_Template.xlsx'));
}

export async function uploadGRAMassive(
	file: File,
	params: {
		programId: number;
		academicPeriodId: number;
		campusId?: number;
		maxRegisterDate?: string;
	},
): Promise<MassiveUploadResult> {
	const fileBase64 = await fileToBase64(file);
	const res = await apiPost('gra/notification/upload-excel', {
		fileBase64,
		programId: params.programId,
		academicPeriodId: params.academicPeriodId,
		campusId: params.campusId ?? 0,
		maxRegisterDate:
			params.maxRegisterDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
	});
	return adaptUploadResult(getApiData<BackendUploadResult>(res) ?? {});
}

export async function generateGRADashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
}): Promise<DashboardResponse> {
	const res = await apiPost('gra/dashboard', params);
	return getApiData<DashboardResponse>(res);
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
