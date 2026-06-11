// ── Request types ──

export type CreateProgramRequest = {
	extra?: Record<string, unknown>;
	isActive?: boolean;
	modalityTypeId: number;
	name: string;
	degree: string;
};

export type FilterAcademicPeriodRequest = Partial<{
	isActive: boolean;
	modalityTypeId: number;
	code: string;
	schoolId: number;
}>;

export type FilterCourseRequest = Partial<{
	extra: Record<string, unknown>;
	isActive: boolean;
	code: string;
	name: { es?: string; en?: string };
	description: { es?: string; en?: string };
	learningOutcome: { es?: string; en?: string };
	academicPeriodId: number;
	programId: number;
	schoolId: number;
}>;

export type FilterProgramRequest = Partial<{
	extra: Record<string, unknown>;
	isActive: boolean;
	modalityTypeId: number;
	code: string;
	name: { es?: string; en?: string };
	degree: { es?: string; en?: string };
	academicPeriodId: number;
	schoolId: number;
}>;

export type UpdateProgramRequest = {
	extra?: Record<string, unknown>;
	isActive?: boolean;
	modalityTypeId?: number;
	name?: string;
	degree?: string;
};

// ── Response types ──

export type AcademicPeriodResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	modalityTypeId: number;
	code: string;
	startDate: string;
	endDate: string;
};

export type CourseResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
	learningOutcome: { en: string; es: string };
};

export type EnrolledStudentResponse = {
	id: number; // enrolledStudentId
	studentSectionEnrollmentId: number;
	studentId: number;
	firstName: string;
	lastName: string;
	email: string;
	studentCode: string;
	courseSectionId: number;
	sectionCode: string;
	professorId: number;
	professorFirstName: string;
	professorLastName: string;
	campusId: number;
	enrollmentDate: string;
	isActive: boolean;
};

type TypeItemResponse = {
	id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
	typeGroupId: number;
};

export type PerformanceLevelResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	instrumentTypeId: number;
	academicPeriodId: number;
	name: { en: string; es: string };
	code: string;
	uniqueValue: string;
	minScore: string;
	maxScore: string;
	maxValue: string;
	academicPeriod: AcademicPeriodResponse;
	instrumentType?: TypeItemResponse;
};

export type ProfessorStaffUserResponse = {
	firstName: string;
	lastName: string;
};

export type ProfessorStaffResponse = {
	id: number;
	staffEmail: string;
	staffPhone: string;
	jobTitle: { en: string; es: string };
	jobDescription: { en: string; es: string };
	user?: ProfessorStaffUserResponse;
};

export type ProfessorSearchResponse = {
	id: number;
	staffId: number;
	staff: ProfessorStaffResponse;
};

export type ProfessorResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	staffId: number;
};

export type ProgramResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	modalityTypeId: number;
	code: string;
	name: { en: string; es: string };
	degree: { en: string; es: string };
};

export type StudyPlanResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	programId: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};

export type StudyPlanAcademicPeriodResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	studyPlanId: number;
	academicPeriodId: number;
	studyPlan: StudyPlanResponse;
	academicPeriod: AcademicPeriodResponse;
};

export type StudyPlanCourseResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	studyPlanAcademicPeriodId: number;
	courseId: number;
	isElective: boolean;
	levelTypeId: number;
	studyPlanAcademicPeriod: StudyPlanAcademicPeriodResponse;
	course: CourseResponse;
};

export type CourseOutcomeMappingResponse = {
	id: number;
	isActive: boolean;
	outcomeId: number;
	studyPlanCourseId: number;
	outcomeTypeId: number;
	extra?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string | null;
};
