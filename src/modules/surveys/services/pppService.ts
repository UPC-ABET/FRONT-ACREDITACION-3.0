import {
	apiGet,
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
import { performanceLevelsService } from '@/modules/academic';
import type { PerformanceLevelResponse } from '@/modules/academic/types';
import type {
	ProgramOutcome,
	ProgramOutcomeGroup,
	I18nOrString,
	CompetenceConfig,
	CompetenceFormData,
	PerformanceLevel,
	DashboardResponse,
	MassiveUploadResult,
	PPPUploadJobStatus,
	PPPNotificationSendRequest,
	BackendPppConfig,
	BackendPppUploadResult,
	PerceptionReportFilters,
	PerceptionReportResponse,
} from '../types';

function adaptPppConfig(raw: BackendPppConfig): CompetenceConfig {
	const extra = raw.extra ?? {};
	return {
		id: raw.id,
		outcomeId: raw.outcomeId,
		commissionTypeCode: raw.outcome?.programCommission?.commissionType?.code,
		generalCompetence: extra.nameEs ?? raw.userOutcomeName ?? '',
		specificCompetence: extra.nameEn ?? extra.nameEs ?? '',
		description: extra.descriptionEs ?? raw.userOutcomeDescription ?? '',
		descriptionEn: extra.descriptionEn ?? '',
		performanceLevel: extra.order ?? 3,
		isActive: raw.isActive,
		isVisible: raw.isVisible ?? raw.isActive,
		isExternal: extra.isExternal ?? false,
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

function adaptUploadResult(raw: BackendPppUploadResult): MassiveUploadResult {
	return {
		total: raw.total ?? 0,
		success: raw.success ?? 0,
		failed: raw.failed ?? 0,
		// `row: 0` marks a job-level failure rather than a worksheet row: row 1 is the header,
		// so no data row can ever carry it.
		errors: (raw.errors ?? []).map((e) => ({
			row: e.row ? e.row : undefined,
			reason: e.key,
			args: e.args,
		})),
		fileName: raw.fileName ?? null,
		hasErrorFile: raw.hasErrorFile ?? false,
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
		isActive: true,
	});
	const list = getApiData<BackendPppConfig[]>(res) ?? [];
	return list.map((c) => adaptPppConfig(c));
}

// The outcomes endpoint returns the raw jsonb name/description ({ es, en }); fall
// back to a plain string in case a caller already flattened it.
function pickEs(value: I18nOrString): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') return value.es ?? value.en ?? '';
	return '';
}

function pickEn(value: I18nOrString): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') return value.en ?? value.es ?? '';
	return '';
}

/**
 * Real outcomes of a program for a period (accreditation.outcomes), grouped by
 * commission on the backend (`GraConfigRepository.findOutcomesGroupedByCommission`,
 * BACK-ACREDITACION-3.0 `src/modules/survey/gra/core/gra-config.repository.ts`) — each
 * group's `commissionCode` comes straight from `accreditation.commissions.code`
 * ("EAC"/"CAC"/...). PPP/GRA/LCFC all measure these same outcomes, so this is the
 * source of truth for building survey configs.
 */
async function listProgramOutcomeGroups(programId: number): Promise<ProgramOutcomeGroup[]> {
	const res = await apiPost('gra/outcomes/list', { programId });
	return getApiData<ProgramOutcomeGroup[]>(res) ?? [];
}

export async function listProgramOutcomes(programId: number): Promise<ProgramOutcome[]> {
	const groups = await listProgramOutcomeGroups(programId);
	return groups.flatMap((g) => g.outcomes ?? []);
}

/**
 * A program can be linked to several commissions (e.g. Ingeniería de Sistemas carries
 * EAC, CAC and ICT at once) but PPP's config should only cover the program's main ABET
 * commission. LCFC applies an analogous preference when auto-assigning a commission to a
 * generated config (`resolvePreferredCommissionId`, BACK-ACREDITACION-3.0
 * `src/modules/survey/lcfc/api/lcfc-config.service.ts`) — that one fuzzy-matches "EAC"
 * across several commission fields since it predates a reliable code column; here
 * `commissionCode` is the real `accreditation.commissions.code` value, so an exact match
 * is sufficient. Same intent, EAC first otherwise whichever commission the program has.
 */
function pickPreferredCommissionGroup(groups: ProgramOutcomeGroup[]): ProgramOutcomeGroup | null {
	if (groups.length === 0) return null;
	return groups.find((g) => g.commissionCode.toUpperCase() === 'EAC') ?? groups[0];
}

/**
 * Build the PPP outcome configurations for a program + period from its real
 * outcomes (one config per outcome). This is what the template/upload require;
 * it replaces creating competences by hand with a hardcoded outcomeId.
 * Outcomes that already have a config are skipped (the backend rejects dupes).
 */
export async function generatePPPConfigFromOutcomes(
	programId: number,
	academicPeriodId: number,
): Promise<{ created: number; skipped: number; total: number }> {
	const groups = await listProgramOutcomeGroups(programId);
	const outcomes = pickPreferredCommissionGroup(groups)?.outcomes ?? [];
	let created = 0;
	let skipped = 0;
	for (let i = 0; i < outcomes.length; i++) {
		const o = outcomes[i];
		try {
			const nameEs = pickEs(o.outcomeName) || o.outcomeCode;
			const nameEn = pickEn(o.outcomeName) || o.outcomeCode;
			await savePPPCompetence({
				id: 0,
				outcomeId: o.outcomeId,
				generalCompetence: nameEs,
				specificCompetence: nameEn,
				description: pickEs(o.outcomeDescription),
				descriptionEn: pickEn(o.outcomeDescription),
				performanceLevel: i + 1,
				academicPeriodId,
				programId,
				school: '1',
			});
			created++;
		} catch {
			// A config for this outcome+program+period already exists — leave it as is.
			skipped++;
		}
	}
	return { created, skipped, total: outcomes.length };
}

export async function savePPPCompetence(data: CompetenceFormData) {
	const payload = {
		outcomeId: data.outcomeId,
		nameEs: data.generalCompetence,
		nameEn: data.specificCompetence || data.generalCompetence,
		descriptionEs: data.description,
		descriptionEn: data.descriptionEn || data.description,
		order: data.performanceLevel,
		programId: data.programId ?? 0,
		isVisible: data.isVisible ?? true,
		// No UI edits this flag any more; echo back whatever the record already carried so a
		// plain save can't overwrite a stored `true` with a hardcoded `false`.
		isExternal: data.isExternal ?? false,
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

export async function downloadPPPTemplate(programId = 0): Promise<void> {
	const params = new URLSearchParams();
	if (programId) params.set('programId', String(programId));
	const qs = params.toString();
	const { blob, response } = await apiGetBlobResponse(`ppp/survey/template${qs ? `?${qs}` : ''}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'PPP_Survey_Template.xlsx'));
}

/** Kicks off the PPP bulk import in the background and returns a job id to poll for
 *  real progress (see {@link getPPPUploadStatus}) — the file itself may take a while
 *  to validate/save row by row, so the caller isn't left waiting on a single request. */
export async function startPPPUpload(
	file: File,
	programId = 0,
	campusId = 0,
): Promise<{ accepted: boolean; jobId: string; totalRows: number }> {
	const fileBase64 = await fileToBase64(file);
	const res = await apiPost('ppp/survey/upload-excel', {
		fileBase64,
		programId,
		campusId,
	});
	const data = getApiData<{ accepted?: boolean; jobId?: string; totalRows?: number }>(res);
	return {
		accepted: data?.accepted ?? false,
		jobId: data?.jobId ?? '',
		totalRows: data?.totalRows ?? 0,
	};
}

export async function getPPPUploadStatus(jobId: string): Promise<PPPUploadJobStatus> {
	const res = await apiGet(`ppp/survey/upload-status/${encodeURIComponent(jobId)}`);
	const data = getApiData<{
		progressPct?: number;
		totalRows?: number;
		processedRows?: number;
		done?: boolean;
		result?: BackendPppUploadResult | null;
	}>(res);
	const result = data?.result ? adaptUploadResult(data.result) : null;
	if (result && result.failed > 0) {
		logger.warn(`PPP upload: ${result.failed} failed rows out of ${result.total}`);
	}
	return {
		progressPct: data?.progressPct ?? 0,
		totalRows: data?.totalRows ?? 0,
		processedRows: data?.processedRows ?? 0,
		done: data?.done ?? false,
		result,
	};
}

/** Kept out of the status poll, which runs once a second and would carry the whole file. */
export async function downloadPPPUploadErrors(jobId: string): Promise<void> {
	const { blob, response } = await apiGetBlobResponse(
		`ppp/survey/upload-errors/${encodeURIComponent(jobId)}`,
	);
	triggerBlobDownload(blob, resolveDownloadFileName(response, 'errores_ppp.xlsx'));
}

export async function generatePPPDashboard(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
	practiceNumber?: number;
}): Promise<DashboardResponse> {
	const res = await apiPost('ppp/survey/dashboard', {
		programId: params.programId,
		campusId: params.campusId,
		practiceNumber: params.practiceNumber,
	});
	return getApiData<DashboardResponse>(res);
}

export async function generatePPPFindings(params: {
	academicPeriodId?: number;
	programId?: number;
	campusId?: number;
	practiceNumber?: number;
}) {
	return apiPost('ppp/survey/generate-findings', {
		programId: params.programId,
		campusId: params.campusId,
		practiceNumber: params.practiceNumber,
	});
}

export async function generatePPPPerceptionPdf(
	params: PerceptionReportFilters & { programId?: number },
): Promise<PerceptionReportResponse> {
	const res = await apiPost('ppp/report/perception', {
		programId: params.programId,
		commissionId: params.commissionId,
		campusId: params.campusId,
		surveyNumbers: params.surveyNumbers,
		lang: params.lang ?? 'es',
	});
	return getApiData<PerceptionReportResponse>(res) ?? { reports: [], zip: null };
}

export async function getPPPSurveysByFilters(params: {
	programId?: number;
	academicPeriodId?: number;
	campusId?: number;
	studentId?: number;
	practiceNumber?: number;
}) {
	const res = await apiPost('ppp/survey/get-by-filters', {
		programId: params.programId,
		campusId: params.campusId,
		studentId: params.studentId,
		practiceNumber: params.practiceNumber,
	});
	return getApiData(res);
}

export async function sendPPPNotification(request: PPPNotificationSendRequest, lang = 'es') {
	return apiPost('ppp/notification/send', { ...request, lang });
}
