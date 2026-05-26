// ── Request types ──

export type CreateProgramRequest = {
	extra?: Record<string, unknown>;
	is_active?: boolean;
	modality_type_id: number;
	name: string;
	degree: string;
};

export type FilterAcademicPeriodRequest = Partial<{
	is_active: boolean;
	modality_type_id: number;
	code: string;
	school_id: number;
}>;

export type FilterCourseRequest = Partial<{
	extra: Record<string, unknown>;
	is_active: boolean;
	code: string;
	name: { es?: string; en?: string };
	description: { es?: string; en?: string };
	learning_outcome: { es?: string; en?: string };
	academic_period_id: number;
	program_id: number;
	school_id: number;
}>;

export type FilterProgramRequest = Partial<{
	extra: Record<string, unknown>;
	is_active: boolean;
	modality_type_id: number;
	code: string;
	name: { es?: string; en?: string };
	degree: { es?: string; en?: string };
	academic_period_id: number;
	school_id: number;
}>;

export type UpdateProgramRequest = {
	extra?: Record<string, unknown>;
	is_active?: boolean;
	modality_type_id?: number;
	name?: string;
	degree?: string;
};

// ── Response types ──

export type AcademicPeriodResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	modality_type_Id: number;
	code: string;
	start_date: string;
	end_date: string;
};

export type CourseResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
	learning_outcome: { en: string; es: string };
};

export type EnrolledStudentResponse = {
	id: number; // enrolled_student_id
	student_section_enrollment_id: number;
	student_id: number;
	first_name: string;
	last_name: string;
	email: string;
	student_code: string;
	course_section_id: number;
	section_code: string;
	professor_id: number;
	professor_first_name: string;
	professor_last_name: string;
	campus_id: number;
	enrollment_date: string;
	is_active: boolean;
};

export type TypeItemResponse = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
	type_group_id: number;
};

export type PerformanceLevelResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	instrument_type_id: number;
	academic_period_id: number;
	name: { en: string; es: string };
	code: string;
	unique_value: string;
	min_score: string;
	max_score: string;
	max_value: string;
	academic_period: AcademicPeriodResponse;
	instrument_type?: TypeItemResponse;
};

export type ProfessorStaffUserResponse = {
	first_name: string;
	last_name: string;
};

export type ProfessorStaffResponse = {
	id: number;
	staff_email: string;
	staff_phone: string;
	job_title: { en: string; es: string };
	job_description: { en: string; es: string };
	user?: ProfessorStaffUserResponse;
};

export type ProfessorSearchResponse = {
	id: number;
	staff_id: number;
	staff: ProfessorStaffResponse;
};

export type ProfessorResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	staff_id: number;
};

export type ProgramResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	modality_type_id: number;
	code: string;
	name: { en: string; es: string };
	degree: { en: string; es: string };
};

export type StudyPlanResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	program_id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

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

export type TypeGroupResponse = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};
