import {
	AcademicPeriodResponse,
	CourseResponse,
	ProgramResponse,
	StudyPlanCourseResponse,
	StudyPlanResponse,
} from '@/modules/academic';
import { CommissionResponse, OutcomeResponse } from '@/modules/accreditation/api/dtos';
import { TypeResponse } from '@/modules/core/api/dtos';
import { RubricQuestionResponse } from './rubric-question.response';

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
