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
	_idEscuela: string,
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
	_escuela: string,
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
	_idPeriodoOrigen: number,
	_idPeriodoDestino: number,
): Promise<void> {
	throw new ApiError(
		'La clonación de configuración LCFC no está disponible en esta versión del backend.',
	);
}

export async function changeLCFCConfigStatus(
	configId: number,
	nuevoEstado: 'ACTIVO' | 'INACTIVO',
) {
	return apiPost('lcfc/config/update-status', {
		updates: [{ configId, isActive: nuevoEstado === 'ACTIVO' }],
	});
}

// ─── Notifications (new backend: single send-all operation) ────────────────

export async function sendLCFCNotification(request: LCFCNotificationSendRequest) {
	return apiPost('lcfc/notification/send', request);
}

// Legacy send used by older hook — kept for compatibility
export async function sendLCFCEmail(request: {
	idCiclo: number;
	idPeriodo: number;
	destinatarios: string;
	asunto: string;
	cuerpo: string;
}) {
	return apiPost('lcfc/notificacion/envio', request);
}

// ─── Email params (legacy) ─────────────────────────────────────────────────

export async function getLCFCEmailParams(): Promise<
	Array<{ nombre: string; description: string }>
> {
	return [];
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadLCFCTemplate(_idPeriodoAcademico: number): Promise<void> {
	throw new ApiError(
		'La descarga de plantilla LCFC no está disponible en esta versión del backend.',
	);
}

export async function uploadLCFCMassive(_file: File, _escuelaActual?: unknown): Promise<void> {
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
	idPeriodoAcademico?: number;
	idEscuela?: string;
	idPeriodo?: number;
	idCarrera?: number;
}) {
	return generateLCFCDashboard({
		academicPeriodId: params.idPeriodoAcademico ?? params.idPeriodo,
		programId: params.idCarrera,
	});
}

// ─── Token & survey (student-facing admin read) ────────────────────────────

export async function validateLCFCToken(token: string) {
	return apiGet(`lcfc/token/validate/${encodeURIComponent(token)}`);
}
