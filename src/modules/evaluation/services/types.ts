// ── Request DTOs ─────────────────────────────────────────────────────────────

export type CreateProjectFullDto = {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
	student_section_enrollment_ids?: number[];
	evaluator_professor_ids?: number[];
};

export type CreateProjectDto = {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
};

export type CreateRubricFullDto = {
	rubric_type_id: number;
	grade_type_id: number;
	study_plan_course_id: number;
	is_active?: boolean;
	extra?: Record<string, unknown>;
	questions: Array<{
		outcome_id?: number;
		question: { es: string; en: string } | string;
		criterias: Array<{
			criteria: { es: string; en: string } | string;
			min_value: number;
			max_value: number;
		}>;
	}>;
};

export type CreateRubricDto = {
	rubric_type_id: number;
	grade_type_id: number;
	study_plan_course_id: number;
};

export type EvaluationScoreDto = {
	rubric_question_criteria_id: number;
	score: number;
	commentaries?: string;
};

export type FilterProjectDto = Partial<{
	code: string;
	is_active: boolean;
	name: { es?: string; en?: string };
	description: { es?: string; en?: string };
	extra: Record<string, unknown>;
	academic_period_id: number;
	program_id: number;
	school_id: number;
	course_id: number;
	student_id: number;
	professor_id: number;
}>;

export type FilterRubricDto = Partial<{
	study_plan_course_id: number;
	grade_type_id: number;
	is_active: boolean;
}>;

export type FinalizeEvaluationDto = {
	project_id: number;
	evaluator_id: number;
	is_pa?: boolean;
};

export type SubmitEvaluationDto = {
	project_student_id: number;
	project_evaluator_id: number;
	observation?: string;
	scores: EvaluationScoreDto[];
};

export type UpdateProjectDto = Partial<{
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
}>;

type I18nText = { es: string; en: string };

export type UpdateRubricCriteriaDto = {
	id?: number;
	criteria: I18nText;
	min_value: number;
	max_value: number;
};

export type UpdateRubricQuestionDto = {
	id?: number;
	outcome_id?: number;
	question: I18nText;
	criterias: UpdateRubricCriteriaDto[];
};

export type UpdateRubricDto = {
	rubric_type_id?: number;
	grade_type_id?: number;
	study_plan_course_id?: number;
	is_active?: boolean;
	extra?: Record<string, unknown>;
	questions?: UpdateRubricQuestionDto[];
};

// ── Response Types ───────────────────────────────────────────────────────────

import { BaseEntity } from '@/shared';
import {
	AcademicPeriodResponse,
	CourseResponse,
	ProgramResponse,
	StudyPlanCourseResponse,
	StudyPlanResponse,
} from '@/modules/academic';
import { CommissionResponse, OutcomeResponse } from '@/modules/accreditation';
import { TypeResponse } from '@/modules/core';

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

export type RubricScoreResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	evaluation_id: number;
	rubric_question_criteria_id: number;
	score: number;
	commentaries?: { en: string; es: string };
};

export type ProjectStudentResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	project_id: number;
	student_section_enrollment_id: number;
	student_info?: {
		first_name: string;
		last_name: string;
		student_id: number;
		section_code: string;
		section_id: number;
	};
};

export type EvaluationResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	project_student_id: number;
	project_evaluator_id: number;
	qualification_status_type_id?: number;
	observation?: { en: string; es: string };
	register_at?: string;
	project_student?: ProjectStudentResponse;
	scores?: RubricScoreResponse[];
};

export { type OutcomeResponse };

export type ProjectByProfessorResponse = {
	project_id: number;
	project_code: string;
	project_name: { en: string; es: string };
	evaluation_date: string;
	course_name: string;
	evaluators: {
		id: number;
		professor_id: number;
		first_name: string;
		last_name: string;
		email: string;
		evaluator_type: { en: string; es: string };
	}[];
	students: {
		id: number;
		first_name: string;
		last_name: string;
		email: string;
		student_code: string;
	}[];
};

export type StudentEvaluationResponse = {
	evaluator_id: number;
	qualification_status_type_id: number;
};

export type ProjectDetailsStudentResponse = {
	id: number;
	student_id: number;
	first_name: string;
	last_name: string;
	email: string;
	student_code: string;
	total_grade: number | null;
	evaluations: StudentEvaluationResponse[] | undefined;
};

export type ProjectDetailsEvaluatorResponse = {
	id: number;
	professor_id: number;
	professor_first_name: string;
	professor_last_name: string;
	professor_email: string;
	evaluator_type_id: number;
	evaluator_type_name: { en: string; es: string };
};

export type CriteriaScoreResponse = {
	student_id: number;
	evaluator_id: number;
	score: number;
	commentaries: { en: string; es: string };
};

export type RubricCriteriaDetailsResponse = {
	id: number;
	text: { en: string; es: string };
	min_value: string;
	max_value: string;
	scores: CriteriaScoreResponse[];
};

export type RubricQuestionDetailsResponse = {
	id: number;
	text: { en: string; es: string };
	outcomeId: number | null;
	criterias: RubricCriteriaDetailsResponse[];
};

export type ProjectDetailsResponse = {
	project: {
		id: number;
		code: string;
		name: { en: string; es: string };
		description: { en: string; es: string };
	};
	academic_period: {
		id: number;
		modality_type_id: number;
		code: string;
	} | null;
	students: ProjectDetailsStudentResponse[];
	evaluators?: ProjectDetailsEvaluatorResponse[];
	rubric: {
		rubric: {
			id: number;
			rubric_type: { id: number; code: string; name: { en: string; es: string } };
			grade_type: { id: number; code: string; name: { en: string; es: string } };
		};
		course: {
			id: number;
			name: { en: string; es: string };
			description: { en: string; es: string };
		};
		outcomes: {
			id: number;
			code: string;
			name: { en: string; es: string };
			description: { en: string; es: string };
			questionIds: number[];
		}[];
		questions: RubricQuestionDetailsResponse[];
	};
};

export type ProjectEvaluatorInfoResponse = {
	first_name: string;
	last_name: string;
	evaluator_type_name: { en: string; es: string };
	evaluator_type_code: string;
};

export type ProjectEvaluatorResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	project_id: number;
	professor_id: number;
	evaluator_type_id: number;
	evaluator_info?: {
		first_name: string;
		last_name: string;
		evaluator_type_name: { en: string; es: string };
		evaluator_type_code: string;
	};
};

export type ProjectResponse = BaseEntity & {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
	students?: ProjectStudentResponse[];
	evaluators?: ProjectEvaluatorResponse[];
};

export type RubricQuestionCriteriaResponse = {
	id: number;
	text: string;
	min_value: number;
	max_value: number;
};

export type RubricQuestionResponse = {
	id: number;
	text: string;
	outcomeId: number;
	criterias?: RubricQuestionCriteriaResponse[];
};

/** Shape returned by GET /rubrics/get-all and similar list endpoints */
export type RubricResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	rubric_type_id: number;
	grade_type_id: number;
	study_plan_course_id: number;
	study_plan_course: StudyPlanCourseResponse;
	grade_type: TypeResponse;
	rubric_type: TypeResponse;
	isUsed: boolean;
};

/** Shape returned by GET /rubrics/get-by-id/:id */
export type GetRubricByIdResponse = {
	rubric: {
		id: number;
		rubric_type_id: number;
		grade_type_id: number;
		study_plan_course_id: number;
		is_active: boolean;
		created_at: string;
		rubric_type: TypeResponse;
		grade_type: TypeResponse;
	};
	course: CourseResponse;
	academicPeriod: AcademicPeriodResponse;
	studyPlan: StudyPlanResponse;
	program: ProgramResponse;
	commissions: Array<CommissionResponse>;
	outcomes: Array<OutcomeResponse>;
	questions: Array<RubricQuestionResponse>;
	isUsed: boolean;
};
