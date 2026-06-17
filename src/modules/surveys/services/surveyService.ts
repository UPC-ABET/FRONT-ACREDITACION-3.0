import { apiGet, apiPost, getApiData, ApiError } from '@/shared/lib';
import type {
	SurveyTokenVerification,
	SurveyOutcomesResponse,
	SurveyCommissionGroup,
	SurveySubmitRequest,
	SurveySubmitResponse,
} from '../types';

const LANG = 'es-PE';

/**
 * Some backend fields (outcome name/description, etc.) come through as I18nText
 * objects ({ es, en }) even though the typings call them strings. Rendering one
 * of those directly crashes React ("Objects are not valid as a React child").
 * Coerce any value to a plain display string, preferring Spanish.
 */
function toText(value: unknown): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const picked = obj.es ?? obj.en;
		if (typeof picked === 'string') return picked;
	}
	return '';
}

interface BackendTokenValidation {
	surveyId?: number;
	surveyStatus?: string;
	studentId?: number;
	studentCode?: string;
	studentName?: string;
	studentEmail?: string;
	programId?: number;
	programName?: string;
	campusId?: number;
	courseSectionId?: number;
	courseName?: string;
	courseCode?: string;
	academicPeriod?: string;
	period?: string;
	school?: string;
	schoolName?: string;
	isCompleted?: boolean;
	completed?: boolean;
}

interface BackendOutcome {
	outcomeConfigId?: number;
	outcomeId?: number;
	commissionId?: number;
	commissionName?: string;
	name?: string;
	specificCompetence?: string;
	generalCompetence?: string;
	description?: string;
	order?: number;
}

interface BackendOutcomesPayload {
	school?: string;
	schoolName?: string;
	programName?: string;
	period?: string;
	courseName?: string;
	courseCode?: string;
	surveyId?: number;
	items?: BackendOutcome[];
	outcomes?: BackendOutcome[];
	scores?: BackendOutcome[];
	list?: BackendOutcome[];
}

function adaptTokenVerification(
	raw: BackendTokenValidation,
	token: string,
): SurveyTokenVerification {
	return {
		token,
		school: toText(raw.school) || toText(raw.schoolName) || 'UPC',
		schoolName: toText(raw.schoolName) || undefined,
		programName: toText(raw.programName),
		period: toText(raw.academicPeriod) || toText(raw.period),
		studentCode: raw.studentCode,
		studentName: toText(raw.studentName) || undefined,
		courseName: toText(raw.courseName) || undefined,
		courseCode: raw.courseCode,
		answered: raw.isCompleted ?? raw.completed ?? false,
		studentId: raw.studentId ?? 0,
		surveyId: raw.surveyId ?? 0,
	};
}

function normalizeOutcomeList(payload: unknown): BackendOutcome[] {
	if (Array.isArray(payload)) return payload as BackendOutcome[];
	if (payload && typeof payload === 'object') {
		const obj = payload as BackendOutcomesPayload;
		return obj.items ?? obj.outcomes ?? obj.scores ?? obj.list ?? [];
	}
	return [];
}

function adaptOutcomes(
	list: BackendOutcome[],
	verification: SurveyTokenVerification,
): SurveyOutcomesResponse {
	const groups: Record<string, SurveyCommissionGroup> = {};

	for (const outcome of list) {
		const commissionId = outcome.commissionId ?? 0;
		const commissionName = toText(outcome.commissionName) || 'General';
		const key = String(commissionId);

		groups[key] ??= { commissionId, commissionName, outcomes: [] };

		groups[key].outcomes.push({
			outcomeId: outcome.outcomeId ?? outcome.outcomeConfigId ?? 0,
			outcomeConfigId: outcome.outcomeConfigId ?? outcome.outcomeId,
			commissionId,
			specificCompetence:
				toText(outcome.specificCompetence) ||
				toText(outcome.name) ||
				`Outcome ${outcome.outcomeId ?? ''}`,
			generalCompetence: toText(outcome.generalCompetence) || undefined,
			description: toText(outcome.description),
			score: null,
		});
	}

	return {
		school: verification.school,
		schoolName: verification.schoolName,
		programName: verification.programName,
		period: verification.period,
		courseName: verification.courseName,
		courseCode: verification.courseCode,
		surveyId: verification.surveyId,
		items: Object.values(groups).sort((a, b) => a.commissionId - b.commissionId),
	};
}

export async function verifyLCFCSurveyToken(
	_school: string,
	token: string,
): Promise<SurveyTokenVerification> {
	const res = await apiGet(`lcfc/token/validate/${encodeURIComponent(token)}`);
	const data = getApiData<BackendTokenValidation>(res);
	if (!data) throw new ApiError('error.survey.lcfc.tokenNotFound');
	return adaptTokenVerification(data, token);
}

export async function getLCFCSurveyOutcomes(
	_school: string,
	_studentId: number,
	_surveyId: number,
	token?: string,
): Promise<SurveyOutcomesResponse> {
	const res = await apiPost('lcfc/survey/get-by-token', { token, language: LANG });
	const data = getApiData<BackendOutcomesPayload>(res);
	const verification: SurveyTokenVerification = {
		token,
		school: data?.school ?? 'UPC',
		schoolName: data?.schoolName,
		programName: data?.programName ?? '',
		period: data?.period ?? '',
		courseName: data?.courseName,
		courseCode: data?.courseCode,
		answered: false,
		studentId: _studentId,
		surveyId: data?.surveyId ?? _surveyId,
	};
	return adaptOutcomes(normalizeOutcomeList(data), verification);
}

export async function submitLCFCSurvey(
	request: SurveySubmitRequest,
): Promise<SurveySubmitResponse> {
	const scores = request.items.map((item) => ({
		outcomeId: item.outcomeId,
		score: item.score,
		commentaries: item.description || undefined,
	}));
	const res = await apiPost<{ message?: string }>('lcfc/survey/complete', {
		token: request.token,
		commentaries: request.comment,
		scores,
	});
	return { success: true, data: { message: res?.message ?? 'Survey submitted successfully' } };
}

export async function verifyGRASurveyToken(token: string): Promise<SurveyTokenVerification> {
	const res = await apiGet(`gra/token/validate/${encodeURIComponent(token)}`);
	const data = getApiData<BackendTokenValidation>(res);
	if (!data) throw new ApiError('error.survey.gra.tokenNotFound');
	return adaptTokenVerification(data, token);
}

export async function getGRASurveyByToken(token: string): Promise<SurveyOutcomesResponse> {
	const res = await apiPost('gra/survey/get-by-token', { token, language: LANG });
	const data = getApiData<BackendOutcomesPayload>(res);
	const verification: SurveyTokenVerification = {
		token,
		school: data?.school ?? 'UPC',
		schoolName: data?.schoolName,
		programName: data?.programName ?? '',
		period: data?.period ?? '',
		answered: false,
		studentId: 0,
		surveyId: data?.surveyId ?? 0,
	};
	return adaptOutcomes(normalizeOutcomeList(data), verification);
}

export async function submitGRASurvey(
	token: string,
	comment: string,
	scores: Array<{ outcomeConfigId: number; score: number; commentaries?: string }>,
): Promise<SurveySubmitResponse> {
	const res = await apiPost<{ message?: string }>('gra/survey/complete', {
		token,
		commentaries: comment,
		scores: scores.map((s) => ({
			outcomeConfigId: s.outcomeConfigId,
			score: s.score,
			commentaries: s.commentaries,
		})),
	});
	return { success: true, data: { message: res?.message ?? 'Survey submitted successfully' } };
}
