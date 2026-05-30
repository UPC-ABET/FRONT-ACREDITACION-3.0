import { apiPost, apiGet, apiDelete, fileToBase64, ApiError } from '@/shared/lib';
import { logger } from '@/shared/lib/logger';
import { getSurveyTypeId } from './academicService';
import type {
	CompetenceConfig,
	CompetenceFormData,
	AcceptanceLevel,
	DashboardResponse,
} from '../types';

// ─── Internal backend shapes ───────────────────────────────────────────────

interface BackendPppConfig {
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
		isVisible?: boolean;
	};
	userOutcomeName?: string;
	outcomeCode?: string;
}

interface BackendAcceptanceLevel {
	id: number;
	minScore: number;
	maxScore: number;
	name: { es?: string; en?: string } | string;
	color?: string;
	order?: number;
	isFinal?: boolean;
}

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptPppConfig(raw: BackendPppConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcomeId,
		competenciaGeneral: extra.nameEs ?? raw.userOutcomeName ?? '',
		competenciaEspecifica: extra.nameEn ?? extra.nameEs ?? '',
		descripcion: extra.descriptionEs ?? '',
		nivelAceptacion: extra.order ?? 3,
		isActive: raw.isActive,
		estado: raw.isActive ? 'ACTIVO' : 'INACTIVO',
		idCarrera: extra.programId,
		idPeriodo: extra.academicPeriodId,
	};
}

function adaptAcceptanceLevel(raw: BackendAcceptanceLevel, index: number): AcceptanceLevel {
	const nameEs = typeof raw.name === 'string' ? raw.name : (raw.name?.es ?? `Nivel ${index + 1}`);
	return {
		id: raw.id,
		nivel: raw.order ?? index + 1,
		descripcion: nameEs,
		rango: `${raw.minScore} – ${raw.maxScore}`,
		minScore: raw.minScore,
		maxScore: raw.maxScore,
		color: raw.color,
	};
}

const RANGE_RE = /([\d.]+)\s*[–-]\s*([\d.]+)/;

function buildAcceptanceLevelItem(level: AcceptanceLevel) {
	const rangeMatch = RANGE_RE.exec(level.rango ?? '');
	const minScore =
		level.minScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[1]) : level.nivel - 1);
	const maxScore = level.maxScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[2]) : level.nivel);
	return {
		id: level.id,
		minScore: minScore,
		maxScore: maxScore,
		name: { es: level.descripcion, en: level.descripcion },
		color: level.color ?? '#888888',
		order: level.nivel,
		isFinal: false,
	};
}

// ─── Competences ───────────────────────────────────────────────────────────

export async function listPPPCompetences(
	academicPeriodId: number,
	programId = 0,
): Promise<CompetenceConfig[]> {
	const res = await apiPost<BackendPppConfig[] | { data?: BackendPppConfig[] }>(
		'ppp/config/get-by-filters',
		{ programId: programId || undefined, academicPeriodId, isActive: true },
	);
	const list = Array.isArray(res) ? res : ((res as { data?: BackendPppConfig[] }).data ?? []);
	return list.map((c) => adaptPppConfig(c));
}

export async function savePPPCompetence(data: CompetenceFormData) {
	const isNew = !data.id || data.id === 0;

	if (isNew) {
		return apiPost('ppp/config/create', {
			outcomeId: data.outcomeId ?? 1,
			nameEs: data.competenciaGeneral,
			nameEn: data.competenciaEspecifica || data.competenciaGeneral,
			descriptionEs: data.descripcion,
			descriptionEn: data.descripcion,
			order: data.nivelAceptacion,
			programId: data.idCarrera ?? 0,
			academicPeriodId: data.idPeriodoAcademico,
			isVisible: true,
		});
	}

	return apiPost(`ppp/config/update/${data.id}`, {
		nameEs: data.competenciaGeneral,
		nameEn: data.competenciaEspecifica || data.competenciaGeneral,
		descriptionEs: data.descripcion,
		descriptionEn: data.descripcion,
		order: data.nivelAceptacion,
		isVisible: true,
	});
}

export async function deletePPPCompetence(id: number) {
	return apiDelete(`ppp/config/delete/${id}`);
}

export async function clonePPPConfiguration(params: {
	idCarreraOrigen: number;
	idPeriodoOrigen: number;
	idCarreraDestino: number;
	idPeriodoDestino: number;
}) {
	return apiPost('ppp/config/replicate', {
		sourceAcademicPeriodId: params.idPeriodoOrigen,
		targetAcademicPeriodId: params.idPeriodoDestino,
		programId: params.idCarreraDestino,
	});
}

// ─── Acceptance levels ─────────────────────────────────────────────────────

export async function listAcceptanceLevels(academicPeriodId: number): Promise<AcceptanceLevel[]> {
	const surveyTypeId = await getSurveyTypeId('PPP');
	const res = await apiPost<BackendAcceptanceLevel[] | { data?: BackendAcceptanceLevel[] }>(
		'acceptance-levels/list',
		{
			surveyTypeCode: 'PPP',
			...(surveyTypeId > 0 && { surveyTypeId }),
			academicPeriodId,
		},
	);
	const obj = res as { data?: BackendAcceptanceLevel[] };
	const list = Array.isArray(res) ? res : (obj.data ?? []);
	return list.map((l, i) => adaptAcceptanceLevel(l, i));
}

export async function updateAcceptanceLevels(
	_academic_period_id: number,
	niveles: AcceptanceLevel[],
) {
	return apiPost('acceptance-levels/bulk-update', {
		items: niveles.filter((n) => n.id).map(buildAcceptanceLevelItem),
	});
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadPPPTemplate(_idPeriodoAcademico: number): Promise<void> {
	throw new ApiError(
		'La descarga de plantilla PPP no está disponible en esta versión del backend.',
	);
}

export async function uploadPPPMassive(
	file: File,
	academicPeriodId: number,
	programId = 0,
	campusId = 0,
): Promise<void> {
	const fileBase64 = await fileToBase64(file);
	const res = await apiPost<{ total: number; success: number; failed: number; errors?: unknown[] }>(
		'ppp/survey/upload-excel',
		{ fileBase64, academicPeriodId, programId, campusId },
	);
	if (res.failed && res.failed > 0) {
		logger.warn(`PPP upload: ${res.failed} filas fallidas de ${res.total}`);
	}
}

export async function uploadPPPMassiveLegacy(_file: File, _escuelaActual?: unknown): Promise<void> {
	throw new ApiError(
		'La carga masiva PPP (legacy) no está disponible en esta versión del backend.',
	);
}

// ─── Dashboard / Reports ───────────────────────────────────────────────────

export async function generatePPPDashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
	practiceNumber?: number;
}): Promise<DashboardResponse> {
	const res = await apiPost<DashboardResponse>('ppp/survey/dashboard', params);
	return res;
}

export async function generatePPPFindings(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
	practiceNumber?: number;
}) {
	return apiPost('ppp/survey/generate-findings', params);
}

// ─── Legacy perception report (kept for backward compat) ──────────────────

export async function generatePPPPerceptionReport(params: {
	idPeriodoAcademico?: number;
	idCarrera?: number;
	idComision?: number;
}) {
	return generatePPPDashboard({
		academicPeriodId: params.idPeriodoAcademico,
		programId: params.idCarrera,
	});
}

// ─── Acceptance level defaults ────────────────────────────────────────────

export async function generateAcceptanceLevelDefaults(
	surveyTypeCode: 'PPP' | 'GRA',
	academicPeriodId: number,
) {
	return apiPost('acceptance-levels/generate-defaults', {
		surveyTypeCode,
		academicPeriodId,
	});
}

// ─── PPP Survey CRUD ──────────────────────────────────────────────────────

export async function getPPPSurveyById(id: number) {
	return apiGet(`ppp/survey/get-by-id/${id}`);
}

export async function getPPPSurveysByFilters(params: {
	programId?: number;
	academicPeriodId?: number;
	campusId?: number;
	studentId?: number;
	practiceNumber?: number;
}) {
	return apiPost('ppp/survey/get-by-filters', params);
}
