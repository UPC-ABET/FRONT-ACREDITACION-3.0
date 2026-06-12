import { apiGet, apiPost, ApiError } from '@/shared/lib';
import type {
	SurveyTokenVerification,
	SurveyOutcomesResponse,
	SurveyCommissionGroup,
	SurveySubmitRequest,
	SurveySubmitResponse,
} from '../types';

const LANG = 'es-PE';

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
	maxRegisterDate?: string;
	academicPeriod?: string;
	isCompleted?: boolean;
	estado?: boolean;
	nombreCarrera?: string;
	ciclo?: string;
	codigo?: string;
	codigoEstudiante?: string;
	nombreCurso?: string;
	idAlumno?: number;
	encuestaId?: number;
	escuela?: string;
}

interface BackendOutcome {
	outcomeConfigId?: number;
	outcomeId: number;
	name?: string;
	description?: string;
	commissionId?: number;
	commissionName?: string;
	order?: number;
	comisionId?: number;
	comisionNombre?: string;
	competenciaEspecifica?: string;
	competenciaGeneral?: string;
	descripcion?: string;
}

interface BackendLegacySurveyOutcomesResponse {
	escuela?: string;
	nombreCarrera?: string;
	ciclo?: string;
	nombreCurso?: string;
	encuestaId?: number;
	lista?: BackendOutcome[];
}

interface BackendLcfcSubmitPayload {
	comentario: string;
	encuestaId: number;
	escuela: string;
	lista: Array<{ comisionId: number; outcomeId: number; puntaje: number; descripcion?: string }>;
}

function adaptTokenVerification(
	raw: BackendTokenValidation,
	token: string,
): SurveyTokenVerification {
	return {
		token,
		school: raw.escuela ?? 'UPC',
		programName: raw.programName ?? raw.nombreCarrera ?? '',
		period: raw.academicPeriod ?? raw.ciclo ?? '',
		studentCode: raw.studentCode ?? raw.codigoEstudiante ?? raw.codigo,
		studentName: raw.studentName,
		courseName: raw.courseName ?? raw.nombreCurso,
		answered: raw.isCompleted ?? raw.estado ?? false,
		studentId: raw.studentId ?? raw.idAlumno ?? 0,
		surveyId: raw.surveyId ?? raw.encuestaId ?? 0,
	};
}

function adaptOutcomes(
	raw: BackendOutcome[],
	verification: SurveyTokenVerification,
): SurveyOutcomesResponse {
	const groups: Record<string, SurveyCommissionGroup> = {};

	for (const o of raw) {
		const commId = o.commissionId ?? o.comisionId ?? 0;
		const commName = o.commissionName ?? o.comisionNombre ?? 'General';
		const key = String(commId);

		if (!groups[key]) {
			groups[key] = { commissionId: commId, commissionName: commName, outcomes: [] };
		}

		groups[key].outcomes.push({
			outcomeId: o.outcomeId,
			commissionId: commId,
			specificCompetence: o.name ?? o.competenciaEspecifica ?? `Outcome ${o.outcomeId}`,
			generalCompetence: o.competenciaGeneral,
			description: o.description ?? o.descripcion ?? '',
			score: null,
		});
	}

	return {
		school: verification.school,
		programName: verification.programName,
		period: verification.period,
		courseName: verification.courseName,
		surveyId: verification.surveyId,
		items: Object.values(groups).sort((a, b) => a.commissionId - b.commissionId),
	};
}

function adaptLegacySurveyOutcomesResponse(
	raw: BackendLegacySurveyOutcomesResponse,
): SurveyOutcomesResponse {
	const dummyVerif: SurveyTokenVerification = {
		school: raw.escuela ?? 'UPC',
		programName: raw.nombreCarrera ?? '',
		period: raw.ciclo ?? '',
		courseName: raw.nombreCurso,
		answered: false,
		studentId: 0,
		surveyId: raw.encuestaId ?? 0,
	};
	return adaptOutcomes(raw.lista ?? [], dummyVerif);
}

export async function verifyLCFCSurveyToken(
	_school: string,
	token: string,
): Promise<SurveyTokenVerification> {
	try {
		const res = await apiGet<BackendTokenValidation>(
			`lcfc/token/validate/${encodeURIComponent(token)}`,
		);
		return adaptTokenVerification(res, token);
	} catch {
		const res = await apiGet<{ success: boolean; resource?: BackendTokenValidation }>(
			`lcfc/notificacion/escuela/${encodeURIComponent(_school)}/token/${encodeURIComponent(token)}`,
		);
		if (!res.resource) throw new ApiError('Invalid or expired token');
		return adaptTokenVerification(res.resource, token);
	}
}

export async function getLCFCSurveyOutcomes(
	_school: string,
	_studentId: number,
	_surveyId: number,
	token?: string,
): Promise<SurveyOutcomesResponse> {
	if (token) {
		const raw = await apiPost<BackendOutcome[] | { data?: { resource?: BackendOutcome[] } }>(
			'lcfc/survey/get-by-token',
			{ token, language: LANG },
		);
		const obj = raw as { data?: { resource?: BackendOutcome[] } };
		const list = Array.isArray(raw) ? raw : (obj.data?.resource ?? []);

		const dummyVerif: SurveyTokenVerification = {
			token,
			school: 'UPC',
			programName: '',
			period: '',
			answered: false,
			studentId: _studentId,
			surveyId: _surveyId,
		};
		return adaptOutcomes(list, dummyVerif);
	}

	const url =
		`lcfc/encuesta/escuela/${encodeURIComponent(_school)}` +
		`/idioma/${LANG}/alumno/${_studentId}/encuesta/${_surveyId}`;
	const res = await apiGet<{
		success: boolean;
		data?: { resource?: BackendLegacySurveyOutcomesResponse };
	}>(url);
	if (!res.data?.resource) throw new ApiError('Could not load survey outcomes');
	return adaptLegacySurveyOutcomesResponse(res.data.resource);
}

export async function submitLCFCSurvey(
	request: SurveySubmitRequest,
): Promise<SurveySubmitResponse> {
	if (request.token) {
		const scores = request.items.map((item) => ({
			outcomeId: item.outcomeId,
			score: item.score,
			commentaries: item.description || undefined,
		}));
		const res = await apiPost<{ success: boolean; message?: string }>('lcfc/survey/complete', {
			token: request.token,
			commentaries: request.comment,
			scores,
		});
		return {
			success: res.success,
			data: { message: res.message ?? 'Survey submitted successfully' },
		};
	}

	const payload: BackendLcfcSubmitPayload = {
		comentario: request.comment,
		encuestaId: request.surveyId,
		escuela: request.school,
		lista: request.items.map((item) => ({
			comisionId: item.commissionId,
			outcomeId: item.outcomeId,
			puntaje: item.score,
			descripcion: item.description,
		})),
	};
	return apiPost<SurveySubmitResponse>('lcfc/encuesta/completar', payload);
}

export async function verifyGRASurveyToken(token: string): Promise<SurveyTokenVerification> {
	const res = await apiGet<BackendTokenValidation>(
		`gra/token/validate/${encodeURIComponent(token)}`,
	);
	return adaptTokenVerification(res, token);
}

export async function getGRASurveyByToken(token: string): Promise<SurveyOutcomesResponse> {
	const raw = await apiPost<BackendOutcome[] | { data?: { resource?: BackendOutcome[] } }>(
		'gra/survey/get-by-token',
		{ token, language: LANG },
	);
	const rawObj = raw as { data?: { resource?: BackendOutcome[] } };
	const list = Array.isArray(raw) ? raw : (rawObj.data?.resource ?? []);

	const dummyVerif: SurveyTokenVerification = {
		token,
		school: 'UPC',
		programName: '',
		period: '',
		answered: false,
		studentId: 0,
		surveyId: 0,
	};
	return adaptOutcomes(list, dummyVerif);
}

export async function submitGRASurvey(
	token: string,
	comment: string,
	scores: Array<{ outcomeConfigId: number; score: number; commentaries?: string }>,
): Promise<SurveySubmitResponse> {
	const res = await apiPost<{ success: boolean; message?: string }>('gra/survey/complete', {
		token,
		commentaries: comment,
		scores: scores.map((s) => ({
			outcomeConfigId: s.outcomeConfigId,
			score: s.score,
			commentaries: s.commentaries,
		})),
	});
	return {
		success: res.success,
		data: { message: res.message ?? 'Survey submitted successfully' },
	};
}
