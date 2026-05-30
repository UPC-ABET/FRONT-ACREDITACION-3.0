import { apiPost, apiDelete, fileToBase64, ApiError } from '@/shared/lib';
import { logger } from '@/shared/lib/logger';
import { getSurveyTypeId } from './academicService';
import { performanceLevelsService } from '@/modules/academic/services/performanceLevelsService';
import type { PerformanceLevelResponse } from '@/modules/academic/types';
import type {
	CompetenceConfig,
	CompetenceFormData,
	PerformanceLevel,
	DashboardResponse,
} from '../types';

// ─── Internal backend shapes ───────────────────────────────────────────────

interface BackendPppConfig {
	id: number;
	outcome_id: number;
	is_active: boolean;
	is_visible?: boolean;
	extra?: {
		survey_type?: string;
		name_es?: string;
		name_en?: string;
		description_es?: string;
		description_en?: string;
		order?: number;
		program_id?: number;
		academic_period_id?: number;
		is_visible?: boolean;
	};
	user_outcome_name?: string;
	outcome_code?: string;
}

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptPppConfig(raw: BackendPppConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcome_id,
		generalCompetence: extra.name_es ?? raw.user_outcome_name ?? '',
		specificCompetence: extra.name_en ?? extra.name_es ?? '',
		description: extra.description_es ?? '',
		performanceLevel: extra.order ?? 3,
		isActive: raw.is_active,
		estado: raw.is_active ? 'ACTIVO' : 'INACTIVO',
		programId: extra.program_id,
		periodId: extra.academic_period_id,
	};
}

function adaptPerformanceLevel(raw: PerformanceLevelResponse, index: number): PerformanceLevel {
	const nameEs = raw.name?.es ?? `Level ${index + 1}`;
	const color =
		raw.extra && typeof raw.extra.color === 'string' ? raw.extra.color : undefined;
	return {
		id: raw.id,
		level: Number(raw.unique_value) || index + 1,
		description: nameEs,
		range: `${raw.min_score} – ${raw.max_score}`,
		minScore: Number(raw.min_score),
		maxScore: Number(raw.max_score),
		color,
	};
}

const RANGE_RE = /([\d.]+)\s*[–-]\s*([\d.]+)/;

function buildPerformanceLevelUpdate(level: PerformanceLevel) {
	const rangeMatch = RANGE_RE.exec(level.range ?? '');
	const minScore =
		level.minScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[1]) : level.level - 1);
	const maxScore = level.maxScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[2]) : level.level);
	return {
		name: { es: level.description, en: level.description },
		min_score: minScore,
		max_score: maxScore,
		max_value: maxScore,
		extra: { color: level.color ?? '#888888' },
	};
}

// ─── Competences ───────────────────────────────────────────────────────────

export async function listPPPCompetences(
	academic_period_id: number,
	program_id = 0,
): Promise<CompetenceConfig[]> {
	const res = await apiPost<BackendPppConfig[] | { data?: BackendPppConfig[] }>(
		'ppp/config/get-by-filters',
		{ program_id: program_id || undefined, academic_period_id, is_active: true },
	);
	const list = Array.isArray(res) ? res : (res.data ?? []);
	return list.map((c) => adaptPppConfig(c));
}

export async function savePPPCompetence(data: CompetenceFormData) {
	const isNew = !data.id || data.id === 0;

	if (isNew) {
		return apiPost('ppp/config/create', {
			outcome_id: data.outcome_id ?? 1,
			name_es: data.generalCompetence,
			name_en: data.specificCompetence || data.generalCompetence,
			description_es: data.description,
			description_en: data.description,
			order: data.performanceLevel,
			program_id: data.programId ?? 0,
			academic_period_id: data.academicPeriodId,
			is_visible: true,
		});
	}

	return apiPost(`ppp/config/update/${data.id}`, {
		name_es: data.generalCompetence,
		name_en: data.specificCompetence || data.generalCompetence,
		description_es: data.description,
		description_en: data.description,
		order: data.performanceLevel,
		is_visible: true,
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
		source_academic_period_id: params.idPeriodoOrigen,
		target_academic_period_id: params.idPeriodoDestino,
		program_id: params.idCarreraDestino,
	});
}

// ─── Performance levels ────────────────────────────────────────────────────

export async function listPPPPerformanceLevels(academic_period_id: number): Promise<PerformanceLevel[]> {
	const instrument_type_id = await getSurveyTypeId('PPP');
	const res = await performanceLevelsService.getByFilters({
		...(instrument_type_id > 0 && { instrument_type_id }),
		academic_period_id,
		is_active: true,
	});
	const list = res?.data ?? [];
	return list.map((l, i) => adaptPerformanceLevel(l, i));
}

export async function updatePPPPerformanceLevels(
	_academic_period_id: number,
	levels: PerformanceLevel[],
): Promise<void> {
	await Promise.all(
		levels
			.filter((l) => l.id != null)
			.map((l) => performanceLevelsService.update(l.id!, buildPerformanceLevelUpdate(l))),
	);
}

// ─── Excel template & upload ───────────────────────────────────────────────

export async function downloadPPPTemplate(_periodId: number): Promise<void> {
	throw new ApiError(
		'PPP template download is not available in this backend version.',
	);
}

export async function uploadPPPMassive(
	file: File,
	academic_period_id: number,
	program_id = 0,
	campus_id = 0,
): Promise<void> {
	const file_base64 = await fileToBase64(file);
	const res = await apiPost<{ total: number; success: number; failed: number; errors?: unknown[] }>(
		'ppp/survey/upload-excel',
		{ file_base64, academic_period_id, program_id, campus_id },
	);
	if (res.failed && res.failed > 0) {
		logger.warn(`PPP upload: ${res.failed} failed rows out of ${res.total}`);
	}
}

export async function uploadPPPMassiveLegacy(_file: File, _school?: unknown): Promise<void> {
	throw new ApiError(
		'PPP legacy bulk upload is not available in this backend version.',
	);
}

// ─── Dashboard / Reports ───────────────────────────────────────────────────

export async function generatePPPDashboard(params: {
	academic_period_id?: number;
	program_id?: number;
	campus_id?: number;
	practice_number?: number;
}): Promise<DashboardResponse> {
	const res = await apiPost<DashboardResponse>('ppp/survey/dashboard', params);
	return res;
}

export async function generatePPPFindings(params: {
	academic_period_id?: number;
	program_id?: number;
	campus_id?: number;
	practice_number?: number;
}) {
	return apiPost('ppp/survey/generate-findings', params);
}

export async function generatePPPPerceptionReport(params: {
	idPeriodoAcademico?: number;
	idCarrera?: number;
	idComision?: number;
}) {
	return generatePPPDashboard({
		academic_period_id: params.idPeriodoAcademico,
		program_id: params.idCarrera,
	});
}

// ─── PPP Survey CRUD ──────────────────────────────────────────────────────

export async function getPPPSurveyById(id: number) {
	return apiPost(`ppp/survey/get-by-id/${id}`, {});
}

export async function getPPPSurveysByFilters(params: {
	program_id?: number;
	academic_period_id?: number;
	campus_id?: number;
	student_id?: number;
	practice_number?: number;
}) {
	return apiPost('ppp/survey/get-by-filters', params);
}
