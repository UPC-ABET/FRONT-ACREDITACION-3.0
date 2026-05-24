import { AcademicPeriodResponse } from './academic-period.response';
import { StudyPlanResponse } from './study-plan.response';

export type StudyPlanAcademicPeriodResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	study_plan_id: number;
	academic_period_id: number;
	study_plan: StudyPlanResponse;
	academic_period: AcademicPeriodResponse;
};
