import { apiPost, apiGet, getApiData } from '@/shared/lib';
import type {
	LCFCCourse,
	LCFCConfigStatus,
	LCFCNotificationSendRequest,
	LCFCEmailParam,
	DashboardResponse,
	PageInfo,
} from '../types';

interface BackendLcfcConfig {
	id: number;
	isActive: boolean;
	extra?: {
		courseSectionId?: number;
		programId?: number;
		academicPeriodId?: number;
	};
	courseName?: string;
	courseCode?: string;
	courseSectionId?: number;
	commissions?: Array<{ commissionId: number; commissionName: string }>;
}

interface BackendLcfcConfigPage {
	resource?: BackendLcfcConfig[];
	items?: BackendLcfcConfig[];
	pageInfo?: PageInfo;
}

function adaptLcfcConfig(raw: BackendLcfcConfig): LCFCCourse {
	return {
		courseId: raw.courseSectionId ?? raw.extra?.courseSectionId ?? raw.id,
		courseName: raw.courseName ?? `Course ${raw.id}`,
		code: raw.courseCode ?? '',
		isActive: raw.isActive,
		commissions: raw.commissions ?? [],
	};
}

export async function listLCFCCourses(
	_school: string,
	academicPeriodId: number,
	programId?: number,
	page = 0,
	pageSize = -1,
): Promise<{ courses: LCFCCourse[]; pageInfo?: PageInfo }> {
	const res = await apiPost('lcfc/config/get-by-filters', {
		academicPeriodId,
		programId: programId || undefined,
		pageNumber: page,
		pageSize,
	});
	const data = getApiData<BackendLcfcConfig[] | BackendLcfcConfigPage>(res);
	if (Array.isArray(data)) {
		return { courses: data.map((c) => adaptLcfcConfig(c)) };
	}
	const list = data?.resource ?? data?.items ?? [];
	return { courses: list.map((c) => adaptLcfcConfig(c)), pageInfo: data?.pageInfo };
}

export async function generateLCFCConfiguration(
	_school: string,
	academicPeriodId: number,
	programId?: number,
	campusId?: number,
) {
	return apiPost('lcfc/config/generate', {
		academicPeriodId,
		programId: programId ?? 0,
		campusId: campusId ?? 0,
	});
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
