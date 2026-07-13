import {
	apiPost,
	apiGet,
	apiPut,
	apiDelete,
	getApiData,
	apiGetBlobResponse,
	triggerBlobDownload,
	resolveDownloadFileName,
} from '@/shared/lib';
import type {
	LCFCCourse,
	LCFCConfigStatus,
	LCFCConfigUpdateRequest,
	LCFCNotificationSendRequest,
	LCFCNotificationSendResponse,
	LCFCNotificationJobStatus,
	LCFCEmailParam,
	GRASendSummary,
	DashboardResponse,
	AvailableSection,
	LCFCSectionOutcome,
	LCFCSectionCommission,
	LCFCStudentSurveys,
	GenerateConfigResult,
	CloneConfigResult,
	BackendLcfcConfig,
	BackendLcfcSectionRow,
	LCFCSectionPage,
	BackendGenerateResult,
	PerceptionReportFilters,
	PerceptionReportResponse,
} from '../types';
import type { I18nText } from '@/shared/types';

function toI18nText(value: string | I18nText | undefined): I18nText {
	if (value == null) return { es: '', en: '' };
	if (typeof value === 'string') return { es: value, en: value };
	return value;
}

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

function adaptLcfcConfig(raw: BackendLcfcConfig): LCFCCourse {
	const extra = raw.extra ?? {};
	const name = toI18nText(raw.userOutcomeName);
	const description = toI18nText(raw.userOutcomeDescription);
	const courseNameI18n = toI18nText(extra.courseName);
	const resolvedCourseName =
		courseNameI18n.es || courseNameI18n.en || name.es || name.en || `Course ${raw.id}`;
	return {
		id: raw.id,
		outcomeId: raw.outcomeId,
		courseName: resolvedCourseName,
		code: extra.sectionCode ?? '',
		isActive: raw.isActive,
		name,
		description,
		programId: extra.programId,
		academicPeriodId: extra.academicPeriodId,
		courseSectionId: extra.courseSectionId,
		sectionCode: extra.sectionCode,
		maxRegisterDate: extra.maxRegisterDate,
		commissionId: extra.commissionId,
	};
}

export async function listLCFCCourses(
	academicPeriodId: number,
	programId?: number,
): Promise<{ courses: LCFCCourse[] }> {
	const res = await apiPost('lcfc/config/get-by-filters', {
		programId: programId || undefined,
	});
	const list = getApiData<BackendLcfcConfig[]>(res) ?? [];
	return { courses: list.map((c) => adaptLcfcConfig(c)) };
}

/** Lightweight, server-paginated section list for the notifications view — avoids the ~1 MB
 *  full-config payload. Search matches course name or section code on the backend. */
export async function listLCFCSectionSummaries(params: {
	programId?: number;
	search?: string;
	page?: number;
	pageSize?: number;
}): Promise<LCFCSectionPage> {
	const res = await apiPost('lcfc/config/list-sections', {
		programId: params.programId || undefined,
		isActive: true,
		search: params.search?.trim() || undefined,
		page: params.page,
		pageSize: params.pageSize,
	});
	const data = getApiData<{
		items?: BackendLcfcSectionRow[];
		total?: number;
		page?: number;
		pageSize?: number;
		totalPages?: number;
	}>(res);
	return {
		items: (data?.items ?? []).map((row) => ({
			id: row.id,
			courseName: toText(row.courseName) || `Course ${row.id}`,
			sectionCode: row.sectionCode ?? '',
			courseSectionId: row.courseSectionId ?? undefined,
			isActive: row.isActive,
		})),
		total: data?.total ?? 0,
		page: data?.page ?? 1,
		pageSize: data?.pageSize ?? 0,
		totalPages: data?.totalPages ?? 0,
	};
}

export async function getAvailableSections(
	programId: number | undefined,
): Promise<AvailableSection[]> {
	const params = new URLSearchParams();
	if (programId) params.set('programId', String(programId));
	const qs = params.toString();
	const res = await apiGet(`lcfc/config/available-sections${qs ? `?${qs}` : ''}`);
	return getApiData<AvailableSection[]>(res) ?? [];
}

export async function getLCFCSectionOutcomes(
	courseSectionId: number,
	programId: number,
): Promise<LCFCSectionOutcome[]> {
	const res = await apiGet(
		`lcfc/config/section-outcomes?courseSectionId=${courseSectionId}&programId=${programId}`,
	);
	const raw = getApiData<Array<{ outcomeId: number; code: unknown; name: unknown }>>(res) ?? [];
	return raw.map((o) => ({
		outcomeId: o.outcomeId,
		code: toText(o.code),
		name: toText(o.name),
	}));
}

export async function getLCFCSectionCommissions(
	courseSectionId: number,
	programId?: number,
): Promise<LCFCSectionCommission[]> {
	const params = new URLSearchParams({ courseSectionId: String(courseSectionId) });
	if (programId) params.set('programId', String(programId));
	const res = await apiGet(`lcfc/config/section-commissions?${params.toString()}`);
	const raw =
		getApiData<
			Array<{
				commissionId: number;
				code: unknown;
				name: unknown;
				typeCode?: unknown;
				typeName?: unknown;
			}>
		>(res) ?? [];
	return raw.map((c) => ({
		commissionId: c.commissionId,
		code: toText(c.code),
		name: toText(c.name),
		typeCode: toText(c.typeCode),
		typeName: toText(c.typeName),
	}));
}

export async function generateLCFCConfiguration(
	modalityTypeId: number,
	academicPeriodId: number,
	programId: number,
	courseSectionIds?: number[],
): Promise<GenerateConfigResult> {
	const body: Record<string, unknown> = { modalityTypeId, programId };
	if (courseSectionIds && courseSectionIds.length > 0) {
		body.courseSectionIds = courseSectionIds;
	}
	const res = await apiPost('lcfc/config/generate', body);
	const data = getApiData<BackendGenerateResult>(res);
	return { created: data?.created ?? 0, skipped: data?.skipped ?? 0 };
}

export async function updateLCFCConfig(id: number, data: LCFCConfigUpdateRequest) {
	return apiPut(`lcfc/config/update/${id}`, data);
}

export async function setLCFCDeadline(
	programId: number,
	academicPeriodId: number,
	maxRegisterDate: string,
) {
	return apiPost('lcfc/config/set-deadline', { programId, maxRegisterDate });
}

export async function deleteLCFCConfig(id: number) {
	return apiDelete(`lcfc/config/delete/${id}`);
}

export async function cloneLCFCConfiguration(
	targetPeriodId: number,
	programId: number,
	sourcePeriodId?: number,
): Promise<CloneConfigResult> {
	const body: Record<string, unknown> = { targetAcademicPeriodId: targetPeriodId, programId };
	if (sourcePeriodId != null) body.sourceAcademicPeriodId = sourcePeriodId;
	const res = await apiPost('lcfc/config/clone', body);
	const data = getApiData<CloneConfigResult>(res);
	return {
		generated: data?.generated ?? 0,
		skipped: data?.skipped ?? 0,
		statusCopied: data?.statusCopied ?? 0,
		sourcePeriodId: data?.sourcePeriodId ?? 0,
	};
}

export async function changeLCFCConfigStatus(configId: number, newStatus: LCFCConfigStatus) {
	return apiPost('lcfc/config/update-status', {
		updates: [{ configId, isActive: newStatus === 'ACTIVE' }],
	});
}

export async function getLCFCSendSummary(
	request: Pick<
		LCFCNotificationSendRequest,
		'programId' | 'campusId' | 'courseSectionId' | 'resend'
	>,
	lang = 'es',
): Promise<GRASendSummary> {
	const res = await apiPost('lcfc/notification/summary', {
		programId: request.programId,
		campusId: request.campusId,
		courseSectionId: request.courseSectionId,
		resend: request.resend,
		lang,
	});
	const data = getApiData<GRASendSummary>(res);
	return {
		totalPrograms: data?.totalPrograms ?? 0,
		totalStudents: data?.totalStudents ?? 0,
		byProgram: data?.byProgram ?? [],
	};
}

export async function sendLCFCNotification(
	request: LCFCNotificationSendRequest,
	lang = 'es',
): Promise<LCFCNotificationSendResponse> {
	const res = await apiPost('lcfc/notification/send', {
		programId: request.programId,
		campusId: request.campusId,
		courseSectionId: request.courseSectionId,
		maxRegisterDate: request.maxRegisterDate,
		surveyBaseUrl: request.surveyBaseUrl,
		resend: request.resend,
		lang,
	});
	return getApiData<LCFCNotificationSendResponse>(res);
}

export async function getLCFCNotificationStatus(jobId: string): Promise<LCFCNotificationJobStatus> {
	const res = await apiGet(`lcfc/notification/status/${encodeURIComponent(jobId)}`);
	const data = getApiData<LCFCNotificationJobStatus>(res);
	return {
		progressPct: data?.progressPct ?? 0,
		emailsSent: data?.emailsSent ?? 0,
		emailsFailed: data?.emailsFailed ?? 0,
	};
}

export async function getLCFCEmailParams(): Promise<LCFCEmailParam[]> {
	return [];
}

export async function generateLCFCDashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
}): Promise<DashboardResponse> {
	const res = await apiPost('lcfc/dashboard', {
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
		byCourse?: unknown[];
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
		byCourse: data?.byCourse ?? [],
		byProgram: data?.byProgram ?? [],
		filters: data?.filters,
	};
}

export async function validateLCFCToken(token: string) {
	return apiGet(`lcfc/token/validate/${encodeURIComponent(token)}`);
}

export async function downloadLCFCSurveys(programId = 0): Promise<void> {
	const params = new URLSearchParams();
	if (programId) params.set('programId', String(programId));
	const qs = params.toString();
	const { blob, response } = await apiGetBlobResponse(`lcfc/export${qs ? `?${qs}` : ''}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'encuestas_lcfc.xlsx'));
}

export async function downloadLCFCReportPdf(programId = 0, lang = 'es'): Promise<void> {
	const params = new URLSearchParams({ lang });
	if (programId) params.set('programId', String(programId));
	const { blob, response } = await apiGetBlobResponse(`lcfc/report-pdf?${params.toString()}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'reporte_lcfc.pdf'));
}

export async function getLCFCStudentSurveys(token: string): Promise<LCFCStudentSurveys | null> {
	const res = await apiGet(`lcfc/survey/list-by-token/${encodeURIComponent(token)}`);
	return getApiData<LCFCStudentSurveys>(res) ?? null;
}

export async function generateLCFCPerceptionPdf(
	params: PerceptionReportFilters & { programId?: number },
): Promise<PerceptionReportResponse> {
	const res = await apiPost('lcfc/report/perception', {
		programId: params.programId,
		commissionId: params.commissionId,
		campusId: params.campusId,
		surveyNumbers: params.surveyNumbers,
		lang: params.lang ?? 'es',
	});
	return getApiData<PerceptionReportResponse>(res) ?? { reports: [], zip: null };
}
