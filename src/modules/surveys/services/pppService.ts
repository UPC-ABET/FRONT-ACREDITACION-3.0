import {
	apiPost,
	apiPut,
	apiDelete,
	apiGetBlobResponse,
	getApiData,
	triggerBlobDownload,
	resolveDownloadFileName,
	fileToBase64,
} from '@/shared/lib';
import { logger } from '@/shared/lib/logger';
import { getSurveyTypeId } from './academicService';
import { performanceLevelsService } from '@/modules/academic/services/performanceLevelsService';
import type { PerformanceLevelResponse } from '@/modules/academic/types';
import type {
	CompetenceConfig,
	CompetenceFormData,
	PerformanceLevel,
	DashboardResponse,
	MassiveUploadResult,
} from '../types';

interface BackendPppConfig {
	id: number;
	outcomeId: number;
	isActive: boolean;
	extra?: {
		surveyType?: string;
		nameEs?: string;
		nameEn?: string;
		descriptionEs?: string;
		descriptionEn?: string;
		order?: number;
		programId?: number;
		academicPeriodId?: number;
	};
	userOutcomeName?: string;
	outcomeCode?: string;
}

interface BackendUploadResult {
	total?: number;
	success?: number;
	failed?: number;
	errors?: Array<{ row?: number; code?: string; reason?: string; message?: string }>;
}

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
	const color = raw.extra && typeof raw.extra.color === 'string' ? raw.extra.color : undefined;
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

function adaptUploadResult(raw: BackendUploadResult): MassiveUploadResult {
	return {
		total: raw.total ?? 0,
		success: raw.success ?? 0,
		failed: raw.failed ?? 0,
		errors: (raw.errors ?? []).map((e) => ({
			row: e.row,
			code: e.code,
			reason: e.reason ?? e.message ?? '',
		})),
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
		minScore,
		maxScore,
		name: { es: level.description, en: level.description },
		color: level.color ?? '#888888',
		order: level.level,
		isFinal: false,
	};
}

export async function listPPPCompetences(
	academicPeriodId: number,
	programId = 0,
): Promise<CompetenceConfig[]> {
	const res = await apiPost('ppp/config/get-by-filters', {
		programId: programId || undefined,
		academicPeriodId,
		isActive: true,
	});
	const list = getApiData<BackendPppConfig[]>(res) ?? [];
	return list.map((c) => adaptPppConfig(c));
}

export async function savePPPCompetence(data: CompetenceFormData) {
	const payload = {
		outcomeId: data.outcomeId ?? 1,
		nameEs: data.generalCompetence,
		nameEn: data.specificCompetence || data.generalCompetence,
		descriptionEs: data.description,
		descriptionEn: data.description,
		order: data.performanceLevel,
		programId: data.programId ?? 0,
		academicPeriodId: data.academicPeriodId,
		isVisible: true,
	};

	if (!data.id || data.id === 0) {
		return apiPost('ppp/config/create', payload);
	}
	return apiPut(`ppp/config/update/${data.id}`, { ...payload, isActive: true });
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
	_academicPeriodId: number,
	levels: PerformanceLevel[],
): Promise<void> {
	await Promise.all(
		levels
			.filter((l) => l.id != null)
			.map((l) => performanceLevelsService.update(l.id!, buildPerformanceLevelUpdate(l))),
	);
}

export async function downloadPPPTemplate(academicPeriodId: number, programId = 0): Promise<void> {
	const params = new URLSearchParams({ academicPeriodId: String(academicPeriodId) });
	if (programId) params.set('programId', String(programId));
	const { blob, response } = await apiGetBlobResponse(`ppp/survey/template?${params.toString()}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'PPP_Survey_Template.xlsx'));
}

export async function uploadPPPMassive(
	file: File,
	academicPeriodId: number,
	programId = 0,
	campusId = 0,
): Promise<MassiveUploadResult> {
	const fileBase64 = await fileToBase64(file);
	const res = await apiPost('ppp/survey/upload-excel', {
		fileBase64,
		academicPeriodId,
		programId,
		campusId,
	});
	const result = adaptUploadResult(getApiData<BackendUploadResult>(res) ?? {});
	if (result.failed > 0) {
		logger.warn(`PPP upload: ${result.failed} failed rows out of ${result.total}`);
	}
	return result;
}

export async function generatePPPDashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
	practiceNumber?: number;
}): Promise<DashboardResponse> {
	const res = await apiPost('ppp/survey/dashboard', params);
	return getApiData<DashboardResponse>(res);
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

export async function getPPPSurveysByFilters(params: {
	programId?: number;
	academicPeriodId?: number;
	campusId?: number;
	studentId?: number;
	practiceNumber?: number;
}) {
	const res = await apiPost('ppp/survey/get-by-filters', params);
	return getApiData(res);
}
