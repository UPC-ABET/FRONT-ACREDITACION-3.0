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
