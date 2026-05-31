import { apiPost, apiGet, ApiError } from '@/shared/lib';
import type {
	LCFCCourse,
	LCFCNotificationSendRequest,
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
		idCurso: raw.courseSectionId ?? raw.extra?.courseSectionId ?? raw.id,
		nombreCurso: raw.courseName ?? `Curso ${raw.id}`,
		codigo: raw.courseCode ?? '',
		isActive: raw.isActive,
		comisiones: [],
	};
}

// ─── Configuration ─────────────────────────────────────────────────────────

export async function listLCFCCourses(
	_school: string,
	academicPeriodId: number,
	programId?: number,
	page = 0,
	pageSize = -1,
): Promise<{ cursos: LCFCCourse[]; pageInfo?: PageInfo }> {
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
		return { cursos: res.map((c) => adaptLcfcConfig(c)) };
	}
	const list = res.data?.resource ?? [];
	return {
		cursos: list.map((c) => adaptLcfcConfig(c)),
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
	throw new ApiError(
		'La clonación de configuración LCFC no está disponible en esta versión del backend.',
	);
}

export async function changeLCFCConfigStatus(
	configId: number,
	newStatus: 'ACTIVO' | 'INACTIVO',
) {
	return apiPost('lcfc/config/update-status', {
		updates: [{ configId, isActive: newStatus === 'ACTIVO' }],
	});
}

// ─── Notifications (new backend: single send-all operation) ────────────────

export async function sendLCFCNotification(request: LCFCNotificationSendRequest) {
	return apiPost('lcfc/notification/send', request);
}

// ─── Email params (legacy) ─────────────────────────────────────────────────

export async function getLCFCEmailParams(): Promise<
	Array<{ nombre: string; description: string }>
> {
	return [];
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadLCFCTemplate(_periodId: number): Promise<void> {
	throw new ApiError(
		'La descarga de plantilla LCFC no está disponible en esta versión del backend.',
	);
}

export async function uploadLCFCMassive(_file: File, _school?: unknown): Promise<void> {
	throw new ApiError('La carga masiva LCFC no está disponible en esta versión del backend.');
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
