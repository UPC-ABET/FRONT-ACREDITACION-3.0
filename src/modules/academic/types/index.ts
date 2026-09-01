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
	schoolFilter: boolean;
	useAcademicPeriod: boolean;
	modalityTypeId: number;
	code: string;
	name: { es?: string; en?: string };
	degree: { es?: string; en?: string };
	academicPeriodId: number;
}>;

export type UpdateProgramRequest = {
	extra?: Record<string, unknown>;
	isActive?: boolean;
	modalityTypeId?: number;
	name?: string;
	degree?: string;
};

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
	id: number;
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
	id: number;
	firstName: string;
	lastName: string;
	email?: string;
};

export type ProfessorStaffResponse = {
	id: number;
	staffEmail: string;
	staffPhone: string;
	jobTitle: { en: string; es: string };
	jobDescription: { en: string; es: string };
	user?: ProfessorStaffUserResponse;
	firstName?: string;
	lastName?: string;
};

export type ProfessorSearchResponse = {
	id: number;
	code?: string;
	staffId: number;
	staff: ProfessorStaffResponse;
};

export type ProfessorMaintenanceItem = {
	id: number;
	staffId: number;
	code: string;
	firstName: string;
	lastName: string;
	staffEmail: string | null;
};

export type ProfessorMaintenanceList = {
	items: ProfessorMaintenanceItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type ProfessorLookupItem = {
	id: number;
	staffId: number;
	code: string | null;
	firstName: string;
	lastName: string;
	staffEmail: string | null;
	user: ProfessorStaffUserResponse | null;
};

export type ProfessorLookupList = PaginatedEnvelope<ProfessorLookupItem>;

export type ProfessorMaintenanceUpdate = {
	code?: string;
	firstName?: string;
	lastName?: string;
	staffEmail?: string | null;
};

export type ProfessorMaintenanceCreate = {
	code: string;
	firstName: string;
	lastName: string;
	staffEmail: string | null;
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

export type CampusResponse = {
	id: number;
	code: string;
	name: { es: string; en: string };
};

export type CourseLookupItem = {
	id: number;
	code: string;
	name: { es: string; en: string };
};

export type CourseSectionMaintenanceItem = {
	id: number;
	courseId: number;
	professorId: number;
	campusId: number;
	sectionModalityTypeId: number;
	courseCode: string;
	courseName: { es: string; en: string };
	sectionCode: string;
	professorCode: string;
	professorFirstName: string | null;
	professorLastName: string | null;
	campusCode: string;
	modalityTypeName: { es: string; en: string };
};

export type CourseSectionMaintenanceList = {
	items: CourseSectionMaintenanceItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type CourseSectionMaintenanceUpdate = {
	sectionCode?: string;
	courseId?: number;
	professorId?: number;
	campusId?: number;
	sectionModalityTypeId?: number;
};

export type CourseSectionMaintenanceCreate = {
	sectionCode: string;
	courseId: number;
	professorId: number;
	campusId: number;
	sectionModalityTypeId: number;
};

export type PaginatedEnvelope<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type EnrolledStudentMaintenanceItem = {
	id: number;
	programId: number;
	campusId: number;
	modalityTypeId: number;
	studentCode: string;
	firstName: string;
	lastName: string;
	campusName: { es: string; en: string };
	programName: { es: string; en: string };
	modalityTypeName: { es: string; en: string };
};

export type EnrolledStudentMaintenanceList = PaginatedEnvelope<EnrolledStudentMaintenanceItem>;

export type EnrolledStudentMaintenanceUpdate = {
	studentCode?: string;
	firstName?: string;
	lastName?: string;
	programId?: number;
	campusId?: number;
	enrollementModalityTypeId?: number;
};

export type EnrolledStudentMaintenanceCreate = {
	studentCode: string;
	firstName: string;
	lastName: string;
	programId: number;
	campusId: number;
	enrollementModalityTypeId: number;
};

export type StudentSectionEnrollmentMaintenanceItem = {
	id: number;
	courseSectionId: number;
	enrolledStudentId: number;
	courseName: { es: string; en: string };
	courseCode: string;
	sectionCode: string;
	studentCode: string;
	studentFirstName: string;
	studentLastName: string;
};

export type StudentSectionEnrollmentMaintenanceList =
	PaginatedEnvelope<StudentSectionEnrollmentMaintenanceItem>;

export type StudentSectionEnrollmentMaintenanceUpdate = {
	courseSectionId?: number;
	enrolledStudentId?: number;
};

export type StudentSectionEnrollmentMaintenanceCreate = {
	courseSectionId: number;
	enrolledStudentId: number;
};

export type StudyPlanMaintenanceItem = {
	id: number;
	programId: number;
	code: string;
	programName: { es: string; en: string };
};

export type StudyPlanMaintenanceList = PaginatedEnvelope<StudyPlanMaintenanceItem>;

export type StudyPlanMaintenanceUpdate = {
	code?: string;
	programId?: number;
};

export type StudyPlanMaintenanceCreate = {
	code: string;
	programId: number;
};

export type StudyPlanCourseRow = {
	id: number;
	courseId: number;
	courseCode: string;
	courseName: { es: string; en: string };
	learningOutcome: { es: string; en: string };
	gradeTypeId: number | null;
};

export type StudyPlanLevelGroup = {
	level: number;
	levelTypeId: number;
	levelName: { es: string; en: string };
	courses: StudyPlanCourseRow[];
};

export type StudyPlanCoursesViewData = {
	levels: StudyPlanLevelGroup[];
	electives: StudyPlanCourseRow[];
};

export type StudyPlanCourseLevelOption = {
	id: number;
	name: { es: string; en: string };
	level: number;
};

export type StudyPlanCourseNewCourse = {
	code: string;
	name: { es: string; en: string };
	learningOutcome?: { es: string; en: string };
};

export type StudyPlanCourseCreate = {
	studyPlanId: number;
	isElective: boolean;
	levelTypeId: number;
	courseId?: number;
	newCourse?: StudyPlanCourseNewCourse;
};

export type StudyPlanCourseCreatedRow = {
	id: number;
	courseId: number;
	courseCode: string;
	courseName: { es: string; en: string };
	learningOutcome: { es: string; en: string };
	levelTypeId: number;
	isElective: boolean;
};

export type CourseUpdateBody = {
	code?: string;
	name?: { es: string; en: string };
	learningOutcome?: { es: string; en: string };
};

// The course fields are shared across every plan; the grade type belongs to this study plan
// course only, so the dialog saves them through two different endpoints.
export type StudyPlanCourseEditBody = CourseUpdateBody & {
	gradeTypeId: number | null;
};

export type CourseOutcomeMappingFilter = Partial<{
	accreditorId: number;
	commissionId: number;
	programId: number;
}>;

export type AccreditorOption = {
	id: number;
	code: string;
	name: { es: string; en: string };
};

export type CommissionOption = {
	id: number;
	code: string;
	name: { es: string; en: string };
	accreditorId: number;
};

export type ProgramOption = {
	id: number;
	code: string;
	name: { es: string; en: string };
};

export type CourseOutcomeMappingFilterRow = {
	programCommissionId: number;
	accreditorId: number;
	accreditorCode: string;
	accreditorName: { es: string; en: string };
	commissionId: number;
	commissionCode: string;
	commissionName: { es: string; en: string };
	programId: number;
	programName: { es: string; en: string };
	academicPeriodId: number;
	academicPeriodCode: string;
};

export type CourseOutcomeMappingOutcomeType = {
	id: number;
	code: string;
	name: { es: string; en: string };
	glyph: string;
	color: string;
	role: string;
};

export type CourseOutcomeMappingColumn = {
	outcomeId: number;
	outcomeCode: string;
	outcomeName: { es: string; en: string };
};

export type CourseOutcomeMark = {
	outcomeId: number;
	outcomeTypeId: number;
};

export type CourseOutcomeMappingCourse = {
	studyPlanCourseId: number;
	studyPlanCode: string;
	courseCode: string;
	courseName: { es: string; en: string };
	isTrainingCourse: boolean;
	mappings: CourseOutcomeMark[];
};

export type CourseOutcomeMappingLevel = {
	levelTypeId: number;
	levelName: { es: string; en: string };
	level: number;
	courses: CourseOutcomeMappingCourse[];
};

export type CourseOutcomeMappingHeader = {
	programCommissionId: number;
	accreditorCode: string;
	commissionCode: string;
	programName: { es: string; en: string };
	academicPeriodCode: string;
};

export type CourseOutcomeMappingView = {
	header: CourseOutcomeMappingHeader;
	outcomeTypes: CourseOutcomeMappingOutcomeType[];
	outcomes: CourseOutcomeMappingColumn[];
	levels: CourseOutcomeMappingLevel[];
	electives: CourseOutcomeMappingCourse[];
};

export type CourseOutcomeMappingBulkSaveCourse = {
	studyPlanCourseId: number;
	outcomes: CourseOutcomeMark[];
};

export type CourseOutcomeMappingBulkSave = {
	programCommissionId: number;
	courses: CourseOutcomeMappingBulkSaveCourse[];
};

export type FilterPerformanceLevelDto = Partial<{
	isActive: boolean;
	academicPeriodId: number;
	instrumentTypeId: number;
}>;

export type CreatePerformanceLevelDto = {
	instrumentTypeId: number;
	academicPeriodId: number;
	name: { es: string; en: string };
	code: string;
	uniqueValue: number;
	minScore: number;
	maxScore: number;
	maxValue: number;
	extra?: { color?: string };
};

export type UpdatePerformanceLevelDto = Partial<CreatePerformanceLevelDto>;

export type StudyPlanCourseFilters = {
	programId?: number;
	courseId?: number;
	isActive?: boolean;
	extra?: Record<string, unknown>;
};

export type CourseOutcomeMappingFilters = {
	studyPlanCourseId?: number;
	isActive?: boolean;
	outcomeTypeId?: number;
};

export type ClassRepresentativeMaintenanceItem = {
	id: number;
	courseSectionId: number;
	enrolledStudentId: number;
	isClassRepresentative: boolean;
	courseName: { es: string; en: string };
	courseCode: string;
	sectionCode: string;
	studentCode: string;
	studentFirstName: string;
	studentLastName: string;
};

export type AssignRepresentativeDto = {
	studentCode: string;
	sectionCode: string;
};

export type ClassRepresentativeMaintenanceList =
	PaginatedEnvelope<ClassRepresentativeMaintenanceItem>;
