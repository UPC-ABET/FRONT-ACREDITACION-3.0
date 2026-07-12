export * from './commissionTab';
export * from './criteriaItem';
export * from './outcomeWithCriteria';
export * from './performanceLevel';
export * from './questionCriteria';
export * from './rubricDetail';
export * from './rubricEditor';
export * from './rubricListRow';
export * from './rubricQuestion';
export * from './performanceReport';
export * from './projectGroup';

export type EvaluationScorePayload = {
	rubricQuestionCriteriaId: number;
	score: number;
	commentaries: Record<string, string>;
};

export type SubmitEvaluationPayload = {
	projectStudentId: number;
	projectEvaluatorId: number;
	rubricId: number;
	observation?: string | Record<string, string> | null;
	scores: EvaluationScorePayload[];
	qualificationStatusTypeId?: number | null;
};

export type CreateProjectFullDto = {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
	studyPlanCourseId: number;
	projectGroupId: number;
	studentSectionEnrollmentIds?: number[];
	evaluators?: { professorId: number; evaluatorTypeId: number }[];
};

export type CreateRubricFullDto = {
	rubricTypeId: number;
	gradeTypeId: number;
	competencyScopeTypeId: number;
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

export type FilterProjectDto = Partial<{
	code: string;
	isActive: boolean;
	name: { es?: string; en?: string };
	description: { es?: string; en?: string };
	extra: Record<string, unknown>;
	academicPeriodId: number;
	programId: number;
	courseId: number;
	studentId: number;
	professorId: number;
	projectGroupId: number;
	search: string;
	page: number;
	pageSize: number;
}>;

export type ProjectPaginatedResponse = {
	items: ProjectResponse[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type GetAllRubricsParams = {
	schoolId?: number;
	academicPeriodId?: number;
	programId?: number;
	courseId?: number;
	page?: number;
	pageSize?: number;
};

export type RubricPaginatedResponse = {
	items: RubricResponse[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type UpdateProjectDto = Partial<{
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
	projectGroupId: number | null;
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
	competencyScopeTypeId?: number;
	studyPlanCourseId?: number;
	isActive?: boolean;
	extra?: Record<string, unknown>;
	questions?: UpdateRubricQuestionDto[];
};

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
import type { ProjectGroup } from './projectGroup';

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

export type RawEvaluationSchool = {
	id: number | string;
	code: string;
	name: I18nText;
};

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
		evaluatorTypeCode: string;
	}[];
	students: {
		id: number;
		firstName: string;
		lastName: string;
		email: string;
		studentCode: string;
		totalGrade: number | null;
	}[];
};

export type ProjectByProfessorPaginatedResponse = {
	items: ProjectByProfessorResponse[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
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
	studyPlanCourseId: number | null;
};

export type ProjectDetailsEvaluatorResponse = {
	id: number;
	professorId: number;
	professorCode: string;
	professorFirstName: string;
	professorLastName: string;
	professorEmail: string;
	evaluatorTypeId: number;
	evaluatorTypeName: { en: string; es: string } | null;
	evaluatorTypeCode: string | null;
	canEvaluate: boolean;
	maxEvaluators: number | null;
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

type ProjectRubricTypeRef = { id: number; code: string; name: { en: string; es: string } };

export type ProjectRubricItemStudentResponse = {
	projectStudentId: number;
	totalGrade: number | null;
	evaluationStatuses: StudentEvaluationResponse[];
	observation?: Record<string, string> | null;
};

export type ProjectRubricItemResponse = {
	gradeType: ProjectRubricTypeRef;
	competencyScopeType: ProjectRubricTypeRef;
	rubric: null | {
		id: number;
		rubricTypeId: number;
		gradeTypeId: number;
		competencyScopeTypeId: number;
		studyPlanCourseId: number;
		isActive: boolean;
		createdAt: string;
		rubricType: ProjectRubricTypeRef;
		gradeType: ProjectRubricTypeRef;
		competencyScopeType: ProjectRubricTypeRef;
	};
	commissions: Array<{
		id: number;
		code: string;
		name: { es: string; en: string };
		outcomeIds: number[];
	}>;
	outcomes: {
		id: number;
		code: string;
		name: { en: string; es: string };
		description: { en: string; es: string };
		questionIds: number[];
	}[];
	questions: RubricQuestionDetailsResponse[];
	students: ProjectRubricItemStudentResponse[];
};

export type ProjectDetailsResponse = {
	project: {
		id: number;
		code: string;
		name: { en: string; es: string };
		description?: { en: string; es: string } | null;
		projectGroup?: ProjectGroup | null;
	};
	academicPeriod: {
		id: number;
		modalityTypeId: number;
		code: string;
	} | null;
	course: {
		id: number;
		name: { en: string; es: string };
		description?: { en: string; es: string };
		learningOutcome?: Record<string, unknown>;
	} | null;
	students: ProjectDetailsStudentResponse[];
	evaluators?: ProjectDetailsEvaluatorResponse[];
	rubrics: Array<{
		studyPlanCourseId: number;
		programName?: { es: string; en: string };
		items: ProjectRubricItemResponse[];
	}>;
};

export type RubricTableHandle = {
	isDirty: boolean;
	canSave: boolean;
	isPending: boolean;
	save: () => Promise<void>;
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
	professorFirstName: string;
	professorLastName: string;
	professorCode: string;
	evaluatorTypeName: { es: string; en: string } | null;
	evaluatorTypeCode: string | null;
	canEvaluate: boolean;
	maxEvaluators: number | null;
};

export type ProjectResponse = BaseEntity & {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
	hasEvaluations?: boolean;
	courseName?: { en: string; es: string };
	projectGroup?: ProjectGroup | null;
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

export type RubricResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	rubricTypeId: number;
	gradeTypeId: number;
	competencyScopeTypeId: number;
	studyPlanCourseId: number;
	studyPlanCourse: StudyPlanCourseResponse;
	gradeType: TypeResponse;
	rubricType: TypeResponse;
	competencyScopeType: TypeResponse;
	isUsed: boolean;
	programName?: { en: string; es: string };
};

export type GetRubricByIdResponse = {
	rubric: {
		id: number;
		rubricTypeId: number;
		gradeTypeId: number;
		competencyScopeTypeId: number;
		studyPlanCourseId: number;
		isActive: boolean;
		createdAt: string;
		rubricType: TypeResponse;
		gradeType: TypeResponse;
		competencyScopeType: TypeResponse;
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

export type RubricTypeResolution = {
	id: number;
	code: string;
	name: { es: string; en: string };
};
