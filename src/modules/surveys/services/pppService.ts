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

// ─── Adapters ──────────────────────────────────────────────────────────────

function adaptPppConfig(raw: BackendPppConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcomeId,
		generalCompetence: extra.nameEs ?? raw.userOutcomeName ?? '',
		specificCompetence: extra.nameEn ?? extra.nameEs ?? '',
		description: extra.descriptionEs ?? '',
		performanceLevel: extra.order ?? 3,
		isActive: raw.isActive,
		programId: extra.programId,
		periodId: extra.academicPeriodId,
	};
}

function adaptPerformanceLevel(raw: PerformanceLevelResponse, index: number): PerformanceLevel {
	const nameEs = raw.name?.es ?? `Level ${index + 1}`;
	const color =
		raw.extra && typeof raw.extra.color === 'string' ? raw.extra.color : undefined;
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

const RANGE_RE = /([\d.]+)\s*[–-]\s*([\d.]+)/;

function buildPerformanceLevelUpdate(level: PerformanceLevel) {
	const rangeMatch = RANGE_RE.exec(level.range ?? '');
	const minScore =
		level.minScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[1]) : level.level - 1);
	const maxScore = level.maxScore ?? (rangeMatch ? Number.parseFloat(rangeMatch[2]) : level.level);
	return {
		id: level.id,
		minScore: minScore,
		maxScore: maxScore,
		name: { es: level.description, en: level.description },
		color: level.color ?? '#888888',
		order: level.level,
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
	const list = Array.isArray(res) ? res : (res.data ?? []);
	return list.map((c) => adaptPppConfig(c));
}

export async function savePPPCompetence(data: CompetenceFormData) {
	const isNew = !data.id || data.id === 0;

	if (isNew) {
		return apiPost('ppp/config/create', {
			outcomeId: data.outcome_id ?? 1,
			nameEs: data.generalCompetence,
			nameEn: data.specificCompetence || data.generalCompetence,
			descriptionEs: data.description,
			descriptionEn: data.description,
			order: data.performanceLevel,
			programId: data.programId ?? 0,
			academicPeriodId: data.academicPeriodId,
			isVisible: true,
		});
	}

	return apiPost(`ppp/config/update/${data.id}`, {
		nameEs: data.generalCompetence,
		nameEn: data.specificCompetence || data.generalCompetence,
		descriptionEs: data.description,
		descriptionEn: data.description,
		order: data.performanceLevel,
		isVisible: true,
	});
}

export async function deletePPPCompetence(id: number) {
	return apiDelete(`ppp/config/delete/${id}`);
}

export async function clonePPPConfiguration(params: {
	sourceProgramId: number;
	sourcePeriodId: number;
	targetProgramId: number;
	targetPeriodId: number;
}) {
	return apiPost('ppp/config/replicate', {
		sourceAcademicPeriodId: params.sourcePeriodId,
		targetAcademicPeriodId: params.targetPeriodId,
		programId: params.targetProgramId,
	});
}

// ─── Performance levels ────────────────────────────────────────────────────

export async function listPPPPerformanceLevels(
	academicPeriodId: number,
): Promise<PerformanceLevel[]> {
	const instrumentTypeId = await getSurveyTypeId('PPP');
	const res = await performanceLevelsService.getByFilters({
		...(instrumentTypeId > 0 && { instrumentTypeId }),
		academicPeriodId,
		isActive: true,
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

export async function generatePPPPerceptionReport(params: {
	academicPeriodId?: number;
	programId?: number;
	commissionId?: number;
}) {
	return generatePPPDashboard({
		academicPeriodId: params.academicPeriodId,
		programId: params.programId,
	});
}

// ─── PPP Survey CRUD ──────────────────────────────────────────────────────

export async function getPPPSurveyById(id: number) {
	return apiPost(`ppp/survey/get-by-id/${id}`, {});
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
