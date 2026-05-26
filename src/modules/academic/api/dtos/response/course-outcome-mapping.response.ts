export type CourseOutcomeMappingResponse = {
	id: number;
	is_active: boolean;
	outcome_id: number;
	study_plan_course_id: number;
	outcome_type_id: number;
	extra?: Record<string, unknown>;
	created_at: string;
	updated_at: string | null;
};
