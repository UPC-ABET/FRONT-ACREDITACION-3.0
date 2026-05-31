export interface StudyPlanPeriod {
	study_plan_academic_period_id: number;
	study_plan_id: number;
	academic_period_id: number;
	study_plan_code: string;
	courses_count: number;
}

export interface AssociateStudyPlanResponse {
	study_plan_academic_period_id: number;
	study_plan_id: number;
	academic_period_id: number;
	courses_instantiated: number;
	cloned_from_spap_id: number | null;
}

export interface AssociateStudyPlanPayload {
	periodId: number;
	studyPlanId: number;
}
