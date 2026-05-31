import { apiPost, apiGet, ApiError } from '@/shared/lib';
import type {
	LCFCCourse,
	LCFCConfigStatus,
	LCFCNotificationSendRequest,
	LCFCEmailParam,
	DashboardResponse,
	SurveyApiResponse,
	PageInfo,
} from '../types';

// ─── Internal backend shapes ───────────────────────────────────────────────

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
}

// ─── Adapter ───────────────────────────────────────────────────────────────

function adaptLcfcConfig(raw: BackendLcfcConfig): LCFCCourse {
	return {
		courseId: raw.courseSectionId ?? raw.extra?.courseSectionId ?? raw.id,
		courseName: raw.courseName ?? `Course ${raw.id}`,
		code: raw.courseCode ?? '',
		isActive: raw.isActive,
		commissions: [],
	};
}

// ─── Configuration ─────────────────────────────────────────────────────────

export async function listLCFCCourses(
	_school: string,
	academicPeriodId: number,
	programId?: number,
	page = 0,
	pageSize = -1,
): Promise<{ courses: LCFCCourse[]; pageInfo?: PageInfo }> {
	const res = await apiPost<BackendLcfcConfig[] | SurveyApiResponse<BackendLcfcConfig[]>>(
		'lcfc/config/get-by-filters',
		{
			academicPeriodId,
			programId: programId || undefined,
			isActive: undefined,
			pageNumber: page,
			pageSize,
		},
	);

	if (Array.isArray(res)) {
		return { courses: res.map((c) => adaptLcfcConfig(c)) };
	}
	const list = res.data?.resource ?? [];
	return {
		courses: list.map((c) => adaptLcfcConfig(c)),
		pageInfo: res.data?.pageInfo,
	};
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
	_sourcePeriodId: number,
	_targetPeriodId: number,
): Promise<void> {
	throw new ApiError('LCFC configuration cloning is not available in this backend version.');
}

export async function changeLCFCConfigStatus(configId: number, newStatus: LCFCConfigStatus) {
	return apiPost('lcfc/config/update-status', {
		updates: [{ configId, isActive: newStatus === 'ACTIVE' }],
	});
}

// ─── Notifications (new backend: single send-all operation) ────────────────

export async function sendLCFCNotification(request: LCFCNotificationSendRequest) {
	return apiPost('lcfc/notification/send', request);
}

// ─── Email params (legacy) ─────────────────────────────────────────────────

export async function getLCFCEmailParams(): Promise<LCFCEmailParam[]> {
	return [];
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadLCFCTemplate(_periodId: number): Promise<void> {
	throw new ApiError('LCFC template download is not available in this backend version.');
}

export async function uploadLCFCMassive(_file: File, _school?: unknown): Promise<void> {
	throw new ApiError('LCFC bulk upload is not available in this backend version.');
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export async function generateLCFCDashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
}): Promise<DashboardResponse> {
	return apiPost<DashboardResponse>('lcfc/dashboard', params);
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

// ─── Token & survey (student-facing admin read) ────────────────────────────

export async function validateLCFCToken(token: string) {
	return apiGet(`lcfc/token/validate/${encodeURIComponent(token)}`);
}
