export * from './commissionTab';
export * from './criteriaItem';
export * from './outcomeWithCriteria';
export * from './performanceLevel';
export * from './questionCriteria';
export * from './rubricDetail';
export * from './rubricEditor';
export * from './rubricListRow';
export * from './rubricQuestion';
export * from './capstone';

// ── Request DTOs ─────────────────────────────────────────────────────────────
export type EvaluationScorePayload = {
	rubricQuestionCriteriaId: number;
	score: number;
	commentaries: Record<string, string>;
};

export type SubmitEvaluationPayload = {
	projectStudentId: number;
	projectEvaluatorId: number;
	rubricId: number;
	observation: { es: string; en: string };
	scores: EvaluationScorePayload[];
	qualificationStatusTypeId?: number | null;
};

export type CreateProjectFullDto = {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
	studentSectionEnrollmentIds?: number[];
	evaluatorProfessorIds?: number[];
};

export type CreateProjectDto = {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
};

export type CreateRubricFullDto = {
	rubricTypeId: number;
	gradeTypeId: number;
	studyPlanCourseId: number;
	isActive?: boolean;
	extra?: Record<string, unknown>;
	questions: Array<{
		outcomeId?: number;
		question: { es: string; en: string } | string;
		criterias: Array<{
			criteria: { es: string; en: string } | string;
			minValue: number;
			maxValue: number;
		}>;
	}>;
};

export type CreateRubricDto = {
	rubricTypeId: number;
	gradeTypeId: number;
	studyPlanCourseId: number;
};

export type EvaluationScoreDto = {
	rubricQuestionCriteriaId: number;
	score: number;
	commentaries?: string;
};

export type FilterProjectDto = Partial<{
	code: string;
	isActive: boolean;
	name: { es?: string; en?: string };
	description: { es?: string; en?: string };
	extra: Record<string, unknown>;
	academicPeriodId: number;
	programId: number;
	schoolId: number;
	courseId: number;
	studentId: number;
	professorId: number;
}>;

export type FilterRubricDto = Partial<{
	studyPlanCourseId: number;
	gradeTypeId: number;
	isActive: boolean;
}>;

export type GetAllRubricsParams = {
	schoolId?: number;
	academicPeriodId?: number;
	programId?: number;
	courseId?: number;
};

export type FinalizeEvaluationDto = {
	projectId: number;
	evaluatorId: number;
	isPa?: boolean;
};

export type SubmitEvaluationDto = {
	projectStudentId: number;
	projectEvaluatorId: number;
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
	minValue: number;
	maxValue: number;
};

export type UpdateRubricQuestionDto = {
	id?: number;
	outcomeId?: number;
	question: I18nText;
	criterias: UpdateRubricCriteriaDto[];
};

export type UpdateRubricDto = {
	rubricTypeId?: number;
	gradeTypeId?: number;
	studyPlanCourseId?: number;
	isActive?: boolean;
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

export type RubricScoreResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	evaluationId: number;
	rubricQuestionCriteriaId: number;
	score: number;
	commentaries?: { en: string; es: string };
};

export type ProjectStudentResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	projectId: number;
	studentSectionEnrollmentId: number;
	studentInfo?: {
		firstName: string;
		lastName: string;
		studentId: number;
		sectionCode: string;
		sectionId: number;
	};
};

export type EvaluationResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	projectStudentId: number;
	projectEvaluatorId: number;
	qualificationStatusTypeId?: number;
	observation?: { en: string; es: string };
	registerAt?: string;
	projectStudent?: ProjectStudentResponse;
	scores?: RubricScoreResponse[];
};

export { type OutcomeResponse };

export type ProjectByProfessorResponse = {
	projectId: number;
	projectCode: string;
	projectName: { en: string; es: string };
	evaluationDate: string;
	courseName: string;
	evaluators: {
		id: number;
		professorId: number;
		firstName: string;
		lastName: string;
		email: string;
		evaluatorType: { en: string; es: string };
	}[];
	students: {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
		studentCode: string;
	}[];
};

export type StudentEvaluationResponse = {
	evaluatorId: number;
	qualificationStatusTypeId: number;
};

export type ProjectDetailsStudentResponse = {
	id: number;
	studentId: number;
	firstName: string;
	lastName: string;
	email: string;
	studentCode: string;
	totalGrade: number | null;
	evaluations: StudentEvaluationResponse[] | undefined;
};

export type ProjectDetailsEvaluatorResponse = {
	id: number;
	professorId: number;
	professorFirstName: string;
	professorLastName: string;
	professorEmail: string;
	evaluatorTypeId: number;
	evaluatorTypeName: { en: string; es: string };
};

export type CriteriaScoreResponse = {
	studentId: number;
	evaluatorId: number;
	score: number;
	commentaries: { en: string; es: string };
};

export type RubricCriteriaDetailsResponse = {
	id: number;
	text: { en: string; es: string };
	minValue: string;
	maxValue: string;
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
	academicPeriod: {
		id: number;
		modalityTypeId: number;
		code: string;
	} | null;
	students: ProjectDetailsStudentResponse[];
	evaluators?: ProjectDetailsEvaluatorResponse[];
	rubric: {
		rubric: {
			id: number;
			rubricType: { id: number; code: string; name: { en: string; es: string } };
			gradeType: { id: number; code: string; name: { en: string; es: string } };
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
	firstName: string;
	lastName: string;
	evaluatorTypeName: { en: string; es: string };
	evaluatorTypeCode: string;
};

export type ProjectEvaluatorResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	projectId: number;
	professorId: number;
	evaluatorTypeId: number;
	evaluatorInfo?: {
		firstName: string;
		lastName: string;
		evaluatorTypeName: { en: string; es: string };
		evaluatorTypeCode: string;
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
	minValue: number;
	maxValue: number;
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
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	rubricTypeId: number;
	gradeTypeId: number;
	studyPlanCourseId: number;
	studyPlanCourse: StudyPlanCourseResponse;
	gradeType: TypeResponse;
	rubricType: TypeResponse;
	isUsed: boolean;
};

/** Shape returned by GET /rubrics/get-by-id/:id */
export type GetRubricByIdResponse = {
	rubric: {
		id: number;
		rubricTypeId: number;
		gradeTypeId: number;
		studyPlanCourseId: number;
		isActive: boolean;
		createdAt: string;
		rubricType: TypeResponse;
		gradeType: TypeResponse;
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
