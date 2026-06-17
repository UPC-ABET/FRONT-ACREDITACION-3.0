import { apiPost, apiGet, apiPut, apiDelete, getApiData } from '@/shared/lib';
import type {
	LCFCCourse,
	LCFCConfigStatus,
	LCFCConfigUpdateRequest,
	LCFCNotificationSendRequest,
	LCFCEmailParam,
	DashboardResponse,
	AvailableSection,
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

function toI18nText(value: string | I18nText | undefined): I18nText {
	if (value == null) return { es: '', en: '' };
	if (typeof value === 'string') return { es: value, en: value };
	return value;
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

export async function deleteLCFCConfig(id: number) {
	return apiDelete(`lcfc/config/delete/${id}`);
}

export async function cloneLCFCConfiguration(
	sourcePeriodId: number,
	targetPeriodId: number,
	programId = 0,
	campusId = 0,
) {
	return apiPost('lcfc/config/clone', {
		sourceAcademicPeriodId: sourcePeriodId,
		targetAcademicPeriodId: targetPeriodId,
		programId,
		campusId,
	});
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
	return getApiData<DashboardResponse>(res);
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
