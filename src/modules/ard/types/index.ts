import type { I18nText } from '@/shared/types';

export type ArdMeetingStatus = 'draft' | 'registered';

export type ArdMeetingSummary = {
	id: number;
	meetingDate: string;
	campusId: number;
	campusName: string;
	status: ArdMeetingStatus;
	attendeeCount: number;
	commentCount: number;
};

export type ArdParticipantKind = 'delegate' | 'guest';

export type ArdParticipant = {
	id: string;
	kind: ArdParticipantKind;
	studentSectionEnrollmentId?: number;
	enrolledStudentId?: number;
	studentCode: string;
	fullName: string;
	sectionId?: number;
	sectionCode?: string;
	courseId?: number;
	courseCode?: string;
	courseName?: string;
	professorId?: number;
	professorName?: string;
	present: boolean;
};

export type ArdStudentOption = {
	id: number;
	enrolledStudentId: number;
	studentCode: string;
	fullName: string;
};

export type ArdSectionOption = {
	id: number;
	courseSectionId?: number;
	studentSectionEnrollmentId?: number;
	sectionCode: string;
	courseId: number;
	courseCode: string;
	courseName: string;
	professorId: number;
	professorName: string;
};

export type ArdComment = {
	id: string;
	participantId: string;
	enrollmentStudentId: number;
	studentCode: string;
	fullName: string;
	courseId: number;
	courseName: string;
	professorId: number;
	professorName: string;
	comment: string;
};

export type ArdMeetingDetail = ArdMeetingSummary & {
	participants: ArdParticipant[];
	comments: ArdComment[];
};

export type ArdMeetingList = {
	items: ArdMeetingSummary[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type ArdMeetingDetailDto = {
	enrollmentStudentId: number;
	courseId: number;
	professorId: number;
	comment: string;
};

export type ArdSaveMeetingDto = {
	meetingDate: string;
	campusId: number;
	programId: number;
	details: ArdMeetingDetailDto[];
};

export type ArdReportFilters = {
	programId?: number;
	academicPeriodId?: number;
	areaId?: number;
	subAreaId?: number;
	meetingDate?: string;
	campusId?: number;
};

export type ArdExportRequest = {
	programId: number;
	lang: 'es' | 'en';
	areaChartIds?: number[];
	subareaChartIds?: number[];
	campusId?: number;
};

export type ArdCourseOption = {
	id: number;
	code: string;
	name: string;
};

export type ArdProfessorOption = {
	id: number;
	code: string;
	fullName: string;
};

// --- ARD creation flow (live API contract: /ards/create, /ards/details/bulk, lookups) ---

export type ArdMaintenanceItem = {
	id: number;
	code: string;
	meetingDate: string;
	campusId: number;
	campusCode: string;
	programId: number;
	programName: I18nText;
	detailsCount: number;
	createdAt: string;
};

export type ArdMaintenanceList = {
	items: ArdMaintenanceItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type ArdMaintenanceParams = {
	page?: number;
	pageSize?: number;
	campusId?: number;
	programId?: number;
	meetingDate?: string;
	search?: string;
};

export type UpdateArdBody = {
	meetingDate?: string;
};

export type ArdDetailView = {
	id: number;
	enrollmentStudentId: number | null;
	studentCode: string | null;
	studentFullName: string | null;
	courseId: number;
	courseCode: string;
	courseName: I18nText;
	professorId: number;
	professorCode: string;
	professorFullName: string;
	comments: I18nText;
};

export type ArdView = {
	id: number;
	code: string;
	meetingDate: string;
	campusId: number;
	campusCode: string;
	academicPeriodId: number;
	programId: number;
	programName: I18nText;
	createdAt: string;
	details: ArdDetailView[];
};

export type ArdClassRepresentative = {
	enrollmentStudentId: number;
	studentId: number;
	studentCode: string;
	studentFullName: string;
	courseSectionId: number;
	courseId: number;
	courseCode: string;
	courseName: I18nText;
	sectionCode: string;
	professorId: number;
	professorCode: string;
	professorFullName: string;
};

export type ArdProgramCourse = {
	courseId: number;
	courseCode: string;
	courseName: I18nText;
};

export type ArdCourseProfessor = {
	professorId: number;
	professorCode: string;
	professorFullName: string;
};

export type CreateArdBody = {
	meetingDate: string;
	campusId: number;
	programId: number;
};

export type ArdDetailInput = {
	enrollmentStudentId: number;
	courseId: number;
	professorId: number;
	comments?: I18nText;
};

export type ArdBulkDetailsBody = {
	ardId: number;
	details: ArdDetailInput[];
};

export type ArdInvitedStudent = {
	enrollmentStudentId: number;
	studentCode: string;
	studentFullName: string;
};
