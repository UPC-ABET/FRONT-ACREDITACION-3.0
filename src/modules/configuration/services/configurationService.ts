import { apiGet, apiPost, apiDelete, getApiData } from '@/shared/lib/apiClient'
import type {
  Period,
  CreatePeriodPayload,
  StudyPlanPeriod,
  AssociateStudyPlanResponse,
  AssociateStudyPlanPayload,
  ProgramCommission,
  AssociateProgramCommissionPayload,
  UnassociateProgramCommissionPayload,
} from '../types'

const BASE = '/configuration'

// The backend wraps every response in { code, message, data }; getApiData unwraps the `data` payload.

// %% PERIODS — POST/GET/DELETE academic.academic_periods

export const listPeriods = async (): Promise<Period[]> =>
  getApiData<Period[]>(await apiGet(`${BASE}/periods`))

export const createPeriod = async (payload: CreatePeriodPayload): Promise<Period> =>
  getApiData<Period>(await apiPost(`${BASE}/periods`, payload))

export const closePeriod = async (periodId: number): Promise<{ success: boolean }> =>
  getApiData<{ success: boolean }>(await apiDelete(`${BASE}/periods/${periodId}`))

// %% STUDY PLAN × PERIOD — malla×período + auto-clonado de study_plan_courses

export const listStudyPlansByPeriod = async (periodId: number): Promise<StudyPlanPeriod[]> =>
  getApiData<StudyPlanPeriod[]>(await apiGet(`${BASE}/periods/${periodId}/study-plans`))

export const associateStudyPlan = async ({ periodId, studyPlanId }: AssociateStudyPlanPayload): Promise<AssociateStudyPlanResponse> =>
  getApiData<AssociateStudyPlanResponse>(await apiPost(`${BASE}/periods/${periodId}/study-plans/${studyPlanId}`, {}))

export const unassociateStudyPlan = async ({ periodId, studyPlanId }: AssociateStudyPlanPayload): Promise<{ success: boolean; deleted_courses: number }> =>
  getApiData<{ success: boolean; deleted_courses: number }>(await apiDelete(`${BASE}/periods/${periodId}/study-plans/${studyPlanId}`))

// %% PROGRAM × COMMISSION — carrera×comisión×período

export const listProgramCommissionsByPeriod = async (periodId: number): Promise<ProgramCommission[]> =>
  getApiData<ProgramCommission[]>(await apiGet(`${BASE}/periods/${periodId}/program-commissions`))

export const associateProgramCommission = async ({ periodId, programId, commissionId }: AssociateProgramCommissionPayload): Promise<ProgramCommission> =>
  getApiData<ProgramCommission>(await apiPost(`${BASE}/periods/${periodId}/program-commissions`, { program_id: programId, commission_id: commissionId }))

export const unassociateProgramCommission = async ({ periodId, id }: UnassociateProgramCommissionPayload): Promise<{ success: boolean }> =>
  getApiData<{ success: boolean }>(await apiDelete(`${BASE}/periods/${periodId}/program-commissions/${id}`))
