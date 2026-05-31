import { apiDelete, apiGet, apiPost, getApiData } from '@/shared/lib/apiClient';
import type {
	AssociateProgramCommissionPayload,
	AssociateStudyPlanPayload,
	AssociateStudyPlanResponse,
	CreatePeriodPayload,
	Period,
	ProgramCommission,
	StudyPlanPeriod,
	UnassociateProgramCommissionPayload,
} from '../types';

const BASE = '/configuration';

// Periods.

export async function listPeriods(): Promise<Period[]> {
	return getApiData<Period[]>(await apiGet(`${BASE}/periods`));
}

export async function createPeriod(payload: CreatePeriodPayload): Promise<Period> {
	return getApiData<Period>(await apiPost(`${BASE}/periods`, payload));
}

export async function closePeriod(periodId: number): Promise<{ success: boolean }> {
	return getApiData<{ success: boolean }>(await apiDelete(`${BASE}/periods/${periodId}`));
}

// Study plan × period (auto-clones study_plan_courses from the previous SPAP).

export async function listStudyPlansByPeriod(periodId: number): Promise<StudyPlanPeriod[]> {
	return getApiData<StudyPlanPeriod[]>(await apiGet(`${BASE}/periods/${periodId}/study-plans`));
}

export async function associateStudyPlan({
	periodId,
	studyPlanId,
}: AssociateStudyPlanPayload): Promise<AssociateStudyPlanResponse> {
	return getApiData<AssociateStudyPlanResponse>(
		await apiPost(`${BASE}/periods/${periodId}/study-plans/${studyPlanId}`, {}),
	);
}

export async function unassociateStudyPlan({
	periodId,
	studyPlanId,
}: AssociateStudyPlanPayload): Promise<{ success: boolean; deleted_courses: number }> {
	return getApiData<{ success: boolean; deleted_courses: number }>(
		await apiDelete(`${BASE}/periods/${periodId}/study-plans/${studyPlanId}`),
	);
}

// Program × commission × period.

export async function listProgramCommissionsByPeriod(
	periodId: number,
): Promise<ProgramCommission[]> {
	return getApiData<ProgramCommission[]>(
		await apiGet(`${BASE}/periods/${periodId}/program-commissions`),
	);
}

export async function associateProgramCommission({
	periodId,
	programId,
	commissionId,
}: AssociateProgramCommissionPayload): Promise<ProgramCommission> {
	return getApiData<ProgramCommission>(
		await apiPost(`${BASE}/periods/${periodId}/program-commissions`, {
			program_id: programId,
			commission_id: commissionId,
		}),
	);
}

export async function unassociateProgramCommission({
	periodId,
	id,
}: UnassociateProgramCommissionPayload): Promise<{ success: boolean }> {
	return getApiData<{ success: boolean }>(
		await apiDelete(`${BASE}/periods/${periodId}/program-commissions/${id}`),
	);
}
