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
import { performanceLevelsService } from '@/modules/academic';
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
	BackendGraConfig,
	BackendGraStudent,
	BackendStudent,
	BackendEmailTemplate,
	BackendUploadResult,
	PerceptionReportFilters,
	PerceptionReportResponse,
} from '../types';

/** Coerce an I18nText ({ es, en }) or plain string to a display string (prefers Spanish). */
function toText(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const picked = obj.es ?? obj.en;
		if (typeof picked === 'string') return picked;
	}
	return '';
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
		isExternal: extra.isExternal ?? false,
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
		isVisible: data.isVisible ?? true,
		isExternal: data.isExternal ?? false,
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

export async function listGRAOutcomes(params: { programId: number }) {
	const res = await apiPost('gra/outcomes/list', { programId: params.programId });
	const raw =
		getApiData<
			Array<{
				commissionId: number;
				commissionName: unknown;
				outcomes: Array<{ outcomeId: number; outcomeCode: unknown; outcomeName: unknown }>;
			}>
		>(res) ?? [];
	// outcomeCode/outcomeName arrive as I18nText objects; coerce so labels don't render
	// as "[object Object]".
	return raw.map((group) => ({
		commissionId: group.commissionId,
		commissionName: toText(group.commissionName),
		outcomes: (group.outcomes ?? []).map((o) => ({
			outcomeId: o.outcomeId,
			outcomeCode: toText(o.outcomeCode),
			outcomeName: toText(o.outcomeName),
		})),
	}));
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

function adaptStudent(student: BackendStudent, fallbackCode = ''): StudentSearchResult {
	const firstName = student.firstName ?? '';
	const lastName = student.lastName ?? '';
	const name =
		student.fullName ??
		localized(student.name) ??
		(firstName || lastName ? `${firstName} ${lastName}`.trim() : '');
	return {
		studentId: student.id,
		code: student.code ?? student.studentCode ?? fallbackCode,
		name,
		email: student.email ?? '',
		career: student.programName ?? '',
		sections: student.sections ?? [],
	};
}

export async function searchStudentByCode(
	studentCode: string,
): Promise<StudentSearchResult | null> {
	const res = await apiPost('students/get-by-filters', {
		code: studentCode,
		isActive: true,
	});
	const list = getApiData<BackendStudent[]>(res) ?? [];
	const match =
		list.find((student) => (student.code ?? student.studentCode) === studentCode) ??
		list[0] ??
		null;
	if (!match) return null;
	return adaptStudent(match, studentCode);
}

const MAX_PREFIX_SUGGESTIONS = 30;

export async function searchStudentsByPrefix(codePrefix: string): Promise<StudentSearchResult[]> {
	if (!codePrefix.trim()) return [];
	const res = await apiPost('students/get-by-filters', {
		code: codePrefix.trim(),
		isActive: true,
	});
	const list = getApiData<BackendStudent[]>(res) ?? [];
	return list.slice(0, MAX_PREFIX_SUGGESTIONS).map((student) => adaptStudent(student));
}

export async function addStudentToNotification(params: {
	studentId: number;
	programId: number;
	campusId?: number;
	maxRegisterDate?: string;
}) {
	return apiPost('gra/notification/save', {
		studentId: params.studentId,
		programId: params.programId,
		// Only send campusId when one was actually chosen; otherwise let the backend resolve the
		// student's default campus. Sending 0 made the backend fail with defaultCampusMissing.
		...(params.campusId ? { campusId: params.campusId } : {}),
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
	const res = await apiPost('gra/notification/list-students', {
		programId: params.programId,
		campusId: params.campusId,
		studentCode: params.studentCode,
	});
	const list = getApiData<BackendGraStudent[]>(res) ?? [];
	return { students: list.map((s) => adaptGraStudent(s)) };
}

export async function sendGRAEmail(
	request: GRAEmailSendRequest,
	lang = 'es',
): Promise<SendEmailResponse> {
	const res = await apiPost('gra/email/send', {
		programId: request.programId,
		surveyBaseUrl: request.surveyBaseUrl,
		notificationMessageId: request.notificationMessageId,
		lang,
	});
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
	const res = await apiPost('gra/dashboard', {
		programId: params.programId,
		campusId: params.campusId,
	});
	const data = getApiData<{
		summary?: {
			total?: number;
			totalSurveys?: number;
			completed?: number;
			pending?: number;
			completionRatePct?: number;
		};
		byProgram?: unknown[];
		filters?: unknown;
	}>(res);
	const s = data?.summary ?? {};
	// Backend returns { total, completed, pending, completionRatePct }; map to the
	// DashboardResponse shape the UI expects (it reads totalSurveys).
	return {
		summary: {
			totalSurveys: s.total ?? s.totalSurveys ?? 0,
			completed: s.completed,
			pending: s.pending,
			completionRatePct: s.completionRatePct,
		},
		byProgram: data?.byProgram ?? [],
		filters: data?.filters,
	};
}

export async function generateGRAPerceptionPdf(
	params: PerceptionReportFilters & { programId?: number },
): Promise<PerceptionReportResponse> {
	const res = await apiPost('gra/report/perception', {
		programId: params.programId,
		commissionId: params.commissionId,
		campusId: params.campusId,
		surveyNumbers: params.surveyNumbers,
		lang: params.lang ?? 'es',
	});
	return getApiData<PerceptionReportResponse>(res) ?? { reports: [], zip: null };
}

export async function downloadGRASurveys(academicPeriodId: number, programId = 0): Promise<void> {
	const params = new URLSearchParams({ academicPeriodId: String(academicPeriodId) });
	if (programId) params.set('programId', String(programId));
	const { blob, response } = await apiGetBlobResponse(`gra/export?${params.toString()}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'encuestas_gra.xlsx'));
}
