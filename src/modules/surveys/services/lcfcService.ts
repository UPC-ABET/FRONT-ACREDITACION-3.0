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
	LCFCEmailParam,
	DashboardResponse,
	AvailableSection,
	LCFCSectionOutcome,
	LCFCStudentSurveys,
} from '../types';
import type { I18nText } from '@/shared/types';

interface BackendLcfcConfig {
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
	};
}

interface BackendGenerateResult {
	created: number;
	skipped: number;
	configs: Array<BackendLcfcConfig & { _status: 'created' | 'skipped' }>;
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
	};
}

export async function listLCFCCourses(
	academicPeriodId: number,
	programId?: number,
): Promise<{ courses: LCFCCourse[] }> {
	const res = await apiPost('lcfc/config/get-by-filters', {
		academicPeriodId,
		programId: programId || undefined,
	});
	const list = getApiData<BackendLcfcConfig[]>(res) ?? [];
	return { courses: list.map((c) => adaptLcfcConfig(c)) };
}

export async function getAvailableSections(
	programId: number,
	academicPeriodId: number,
): Promise<AvailableSection[]> {
	const res = await apiGet(
		`lcfc/config/available-sections?programId=${programId}&academicPeriodId=${academicPeriodId}`,
	);
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

export async function generateLCFCConfiguration(
	modalityTypeId: number,
	academicPeriodId: number,
	programId: number,
	courseSectionIds?: number[],
): Promise<GenerateConfigResult> {
	const body: Record<string, unknown> = { modalityTypeId, academicPeriodId, programId };
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
	return apiPost('lcfc/config/set-deadline', { programId, academicPeriodId, maxRegisterDate });
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

export async function sendLCFCNotification(request: LCFCNotificationSendRequest, lang = 'es') {
	return apiPost('lcfc/notification/send', { ...request, lang });
}

export async function getLCFCEmailParams(): Promise<LCFCEmailParam[]> {
	return [];
}

export async function generateLCFCDashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
}): Promise<DashboardResponse> {
	const res = await apiPost('lcfc/dashboard', params);
	const data = getApiData<{
		summary?: {
			total?: number;
			totalSurveys?: number;
			completed?: number;
			pending?: number;
			completionRatePct?: number;
		};
		byCourse?: unknown[];
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
		filters: data?.filters,
	};
}

export async function generateLCFCPerceptionReport(params: {
	academicPeriodId?: number;
	programId?: number;
}) {
	return generateLCFCDashboard({
		academicPeriodId: params.academicPeriodId,
		programId: params.programId,
	});
}

export async function validateLCFCToken(token: string) {
	return apiGet(`lcfc/token/validate/${encodeURIComponent(token)}`);
}

export async function downloadLCFCSurveys(academicPeriodId: number, programId = 0): Promise<void> {
	const params = new URLSearchParams({ academicPeriodId: String(academicPeriodId) });
	if (programId) params.set('programId', String(programId));
	const { blob, response } = await apiGetBlobResponse(`lcfc/export?${params.toString()}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'encuestas_lcfc.xlsx'));
}

export async function getLCFCStudentSurveys(token: string): Promise<LCFCStudentSurveys | null> {
	const res = await apiGet(`lcfc/survey/list-by-token/${encodeURIComponent(token)}`);
	return getApiData<LCFCStudentSurveys>(res) ?? null;
}
