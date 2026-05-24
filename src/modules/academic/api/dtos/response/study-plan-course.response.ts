import type { CourseResponse, StudyPlanAcademicPeriodResponse } from './';

export type StudyPlanCourseResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	study_plan_academic_period_id: number;
	course_id: number;
	is_elective: boolean;
	level_type_id: number;
	study_plan_academic_period: StudyPlanAcademicPeriodResponse;
	course: CourseResponse;
};
