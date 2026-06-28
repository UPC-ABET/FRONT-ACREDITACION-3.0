import { ApiResponse } from '@/shared';
import {
	apiDelete,
	apiGet,
	apiPost,
	apiPostBlob,
	apiPostBlobResponse,
	apiPut,
	resolveDownloadFileName,
} from '@/shared/lib';
import type {
	ArdCourseOption,
	ArdExportRequest,
	ArdMeetingDetail,
	ArdMeetingList,
	ArdMeetingSummary,
	ArdParticipant,
	ArdProfessorOption,
	ArdReportFilters,
	ArdSaveMeetingDto,
	ArdSectionOption,
	ArdStudentOption,
} from '../types';

const ARD_API_BASE = '/ards';

type ArdRequestContext = {
	academicPeriodId?: number | null;
	schoolId?: number | null;
};

function buildArdHeaders(context?: ArdRequestContext): Record<string, string> {
	const headers: Record<string, string> = {};

	if (context?.academicPeriodId != null) {
		headers['X-Academic-Period-Id'] = String(context.academicPeriodId);
	}

	if (context?.schoolId != null) {
		headers['X-School-Id'] = String(context.schoolId);
	}

	return headers;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getRecordField(record: UnknownRecord, key: string): UnknownRecord | null {
	const value = record[key];
	return isRecord(value) ? value : null;
}

function getStringField(record: UnknownRecord, ...keys: string[]): string | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'string' && value.trim() !== '') return value;
		if (typeof value === 'number') return String(value);
	}
	return undefined;
}

function getNumberField(record: UnknownRecord, ...keys: string[]): number | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === 'number' && Number.isFinite(value)) return value;
		if (typeof value === 'string' && value.trim() !== '') {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) return parsed;
		}
	}
	return undefined;
}

function getBooleanField(record: UnknownRecord, key: string): boolean | undefined {
	const value = record[key];
	return typeof value === 'boolean' ? value : undefined;
}

function getArrayField(record: UnknownRecord, ...keys: string[]): unknown[] {
	for (const key of keys) {
		const value = record[key];
		if (Array.isArray(value)) return value;
	}
	return [];
}

function getEnvelopeData(response: unknown): unknown {
	if (!isRecord(response)) return response;
	if ('data' in response) return response.data;
	if ('resource' in response) return response.resource;
	return response;
}

function withData<T>(response: unknown, data: T): ApiResponse<T> {
	const record = isRecord(response) ? response : {};
	return {
		code: getNumberField(record, 'code', 'statusCode') ?? 200,
		message: getStringField(record, 'message') ?? 'ok',
		data,
	};
}

function getLocalizedName(value: unknown): string | undefined {
	if (typeof value === 'string' && value.trim() !== '') return value;
	if (!isRecord(value)) return undefined;
	return getStringField(value, 'es', 'en');
}

function getFullName(record: UnknownRecord): string {
	const fullName = getStringField(record, 'fullName', 'studentName', 'name');
	if (fullName) return fullName;

	const firstName = getStringField(record, 'firstName', 'studentFirstName') ?? '';
	const lastName = getStringField(record, 'lastName', 'studentLastName') ?? '';
	return `${firstName} ${lastName}`.trim();
}

function normalizeMeetingSummary(value: unknown): ArdMeetingSummary {
	const record = isRecord(value) ? value : {};
	const campus = getRecordField(record, 'campus');
	const attendeeCount =
		getNumberField(record, 'attendeeCount', 'attendanceCount', 'participantsCount') ?? 0;
	const commentCount = getNumberField(record, 'commentCount', 'commentsCount') ?? 0;

	return {
		id: getNumberField(record, 'id', 'ardId') ?? 0,
		meetingDate: getStringField(record, 'meetingDate', 'date') ?? '',
		campusId: getNumberField(record, 'campusId') ?? getNumberField(campus ?? {}, 'id') ?? 0,
		campusName:
			getStringField(record, 'campusName') ??
			getLocalizedName(record.campusName) ??
			getStringField(campus ?? {}, 'code', 'name') ??
			'',
		status: getStringField(record, 'status') === 'registered' ? 'registered' : 'draft',
		attendeeCount,
		commentCount,
	};
}

function normalizeMeetingList(value: unknown): ArdMeetingList {
	const record = isRecord(value) ? value : {};
	const items = Array.isArray(value) ? value : getArrayField(record, 'items', 'rows', 'content');
	const pageSize = getNumberField(record, 'pageSize', 'limit') ?? items.length;
	const total = getNumberField(record, 'total', 'totalItems', 'count') ?? items.length;

	return {
		items: items.map(normalizeMeetingSummary),
		total,
		page: getNumberField(record, 'page', 'currentPage') ?? 1,
		pageSize,
		totalPages: getNumberField(record, 'totalPages') ?? Math.max(1, Math.ceil(total / pageSize)),
	};
}

function normalizeParticipant(
	value: unknown,
	fallbackKind: ArdParticipant['kind'],
	defaultPresent: boolean,
): ArdParticipant {
	const record = isRecord(value) ? value : {};
	const studentSectionEnrollmentId = getNumberField(
		record,
		'studentSectionEnrollmentId',
		'representativeStudentSectionEnrollmentId',
	);
	const enrolledStudentId = getNumberField(record, 'enrolledStudentId', 'studentId');
	const courseSectionId = getNumberField(record, 'courseSectionId', 'sectionId');
	const studentCode = getStringField(record, 'studentCode', 'code') ?? '';
	const rawKind = getStringField(record, 'kind');
	const kind = rawKind === 'guest' || rawKind === 'delegate' ? rawKind : fallbackKind;

	return {
		id: `${kind}:${studentSectionEnrollmentId ?? enrolledStudentId ?? studentCode}:${courseSectionId ?? 'none'}`,
		kind,
		studentSectionEnrollmentId,
		enrolledStudentId,
		studentCode,
		fullName: getFullName(record),
		sectionId: courseSectionId,
		sectionCode: getStringField(record, 'sectionCode'),
		courseId: getNumberField(record, 'courseId'),
		courseCode: getStringField(record, 'courseCode'),
		courseName: getStringField(record, 'courseName') ?? getLocalizedName(record.courseName),
		professorId: getNumberField(record, 'professorId'),
		professorName: getStringField(record, 'professorName') ?? getFullName(record),
		present: getBooleanField(record, 'present') ?? defaultPresent,
	};
}

function normalizeStudentOption(value: unknown): ArdStudentOption {
	const record = isRecord(value) ? value : {};
	const enrolledStudentId = getNumberField(record, 'enrolledStudentId', 'id', 'studentId') ?? 0;

	return {
		id: enrolledStudentId,
		enrolledStudentId,
		studentCode: getStringField(record, 'studentCode', 'code') ?? '',
		fullName: getFullName(record),
	};
}

function normalizeSectionOption(value: unknown): ArdSectionOption {
	const record = isRecord(value) ? value : {};
	const courseSectionId = getNumberField(record, 'courseSectionId', 'id', 'sectionId') ?? 0;

	return {
		id: courseSectionId,
		courseSectionId,
		studentSectionEnrollmentId: getNumberField(record, 'studentSectionEnrollmentId'),
		sectionCode: getStringField(record, 'sectionCode') ?? '',
		courseId: getNumberField(record, 'courseId') ?? 0,
		courseCode: getStringField(record, 'courseCode') ?? '',
		courseName: getStringField(record, 'courseName') ?? getLocalizedName(record.courseName) ?? '',
		professorId: getNumberField(record, 'professorId') ?? 0,
		professorName: getStringField(record, 'professorName') ?? getFullName(record),
	};
}

function normalizeCourseOption(value: unknown): ArdCourseOption {
	const record = isRecord(value) ? value : {};
	return {
		id: getNumberField(record, 'id', 'courseId') ?? 0,
		code: getStringField(record, 'code', 'courseCode') ?? '',
		name: getStringField(record, 'name', 'courseName') ?? getLocalizedName(record.name) ?? '',
	};
}

function normalizeProfessorOption(value: unknown): ArdProfessorOption {
	const record = isRecord(value) ? value : {};
	return {
		id: getNumberField(record, 'id', 'professorId') ?? 0,
		code: getStringField(record, 'code', 'professorCode') ?? '',
		fullName: getFullName(record),
	};
}

function normalizeComment(value: unknown): ArdMeetingDetail['comments'][number] {
	const record = isRecord(value) ? value : {};
	const participantId = getStringField(record, 'participantId') ?? '';
	const enrollmentStudentId = getNumberField(record, 'enrollmentStudentId', 'studentId');

	return {
		id: getStringField(record, 'id') ?? `comment:${participantId || enrollmentStudentId}`,
		participantId,
		enrollmentStudentId: enrollmentStudentId ?? 0,
		studentCode: getStringField(record, 'studentCode', 'code') ?? '',
		fullName: getFullName(record),
		courseId: getNumberField(record, 'courseId') ?? 0,
		courseName: getStringField(record, 'courseName') ?? getLocalizedName(record.courseName) ?? '',
		professorId: getNumberField(record, 'professorId') ?? 0,
		professorName: getStringField(record, 'professorName') ?? getFullName(record),
		comment: getStringField(record, 'comment', 'comments') ?? '',
	};
}

function normalizeMeetingDetail(value: unknown): ArdMeetingDetail {
	const record = isRecord(value) ? value : {};
	const participants = getArrayField(record, 'participants');
	const representatives = getArrayField(record, 'representatives', 'delegateStudents');
	const guests = getArrayField(record, 'guests', 'guestStudents');

	return {
		...normalizeMeetingSummary(value),
		participants:
			participants.length > 0
				? participants.map((participant) => normalizeParticipant(participant, 'delegate', true))
				: [
						...representatives.map((participant) =>
							normalizeParticipant(participant, 'delegate', true),
						),
						...guests.map((participant) => normalizeParticipant(participant, 'guest', true)),
					],
		comments: getArrayField(record, 'comments').map(normalizeComment),
	};
}

function toQuery(params: Record<string, string | number | undefined>) {
	const query = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') {
			query.set(key, String(value));
		}
	}

	const qs = query.toString();
	return qs ? `?${qs}` : '';
}

export const ardService = {
	async list(
		params: {
			page?: number;
			pageSize?: number;
			search?: string;
		},
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdMeetingList>> {
		const response = await apiGet<unknown>(`${ARD_API_BASE}/maintenance${toQuery(params)}`, {
			headers: buildArdHeaders(context),
		});
		return withData(response, normalizeMeetingList(getEnvelopeData(response)));
	},

	async getById(id: number): Promise<ApiResponse<ArdMeetingDetail>> {
		const response = await apiGet<unknown>(`${ARD_API_BASE}/get-by-id/${id}`);
		return withData(response, normalizeMeetingDetail(getEnvelopeData(response)));
	},

	async create(
		body: ArdSaveMeetingDto,
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdMeetingSummary>> {
		const response = await apiPost<unknown>(`${ARD_API_BASE}/create`, body, {
			headers: buildArdHeaders(context),
		});
		return withData(response, normalizeMeetingSummary(getEnvelopeData(response)));
	},

	async update(
		id: number,
		body: ArdSaveMeetingDto,
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdMeetingSummary>> {
		const response = await apiPut<unknown>(`${ARD_API_BASE}/update/${id}`, body, {
			headers: buildArdHeaders(context),
		});
		return withData(response, normalizeMeetingSummary(getEnvelopeData(response)));
	},

	delete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`${ARD_API_BASE}/delete/${id}`);
	},

	async getDelegateCandidates(
		campusId: number,
		programId: number,
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdParticipant[]>> {
		const response = await apiGet<unknown>(
			`${ARD_API_BASE}/attendees${toQuery({ campusId, programId })}`,
			{
				headers: buildArdHeaders(context),
			},
		);
		const data = getEnvelopeData(response);
		const delegates = getArrayField(isRecord(data) ? data : {}, 'delegates');
		return withData(
			response,
			delegates.map((item) => normalizeParticipant(item, 'delegate', true)),
		);
	},

	async getGuestCandidates(
		params: {
			campusId: number;
			programId: number;
			search?: string;
		},
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdStudentOption[]>> {
		const response = await apiGet<unknown>(
			`${ARD_API_BASE}/attendees${toQuery({
				campusId: params.campusId,
				programId: params.programId,
			})}`,
			{
				headers: buildArdHeaders(context),
			},
		);
		const data = getEnvelopeData(response);
		const guests = getArrayField(isRecord(data) ? data : {}, 'guests');
		return withData(response, guests.map(normalizeStudentOption));
	},

	async getSectionOptions(
		params: {
			campusId: number;
			studentCode?: string;
		},
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdSectionOption[]>> {
		const response = await apiGet<unknown>(`${ARD_API_BASE}/course-sections${toQuery(params)}`, {
			headers: buildArdHeaders(context),
		});
		const data = getEnvelopeData(response);
		const items = Array.isArray(data) ? data : isRecord(data) ? getArrayField(data, 'items') : [];
		return withData(response, items.map(normalizeSectionOption));
	},

	async getOrgChartCourses(
		programId: number,
		campusId: number,
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdCourseOption[]>> {
		const response = await apiGet<unknown>(
			`${ARD_API_BASE}/program-courses${toQuery({ programId, campusId })}`,
			{
				headers: buildArdHeaders(context),
			},
		);
		const data = getEnvelopeData(response);
		const courses = Array.isArray(data)
			? data
			: isRecord(data)
				? getArrayField(data, 'courses')
				: [];
		return withData(response, courses.map(normalizeCourseOption));
	},

	async getCourseProfessors(
		courseId: number,
		programId: number,
		campusId: number,
		context?: ArdRequestContext,
	): Promise<ApiResponse<ArdProfessorOption[]>> {
		const response = await apiGet<unknown>(
			`${ARD_API_BASE}/program-courses${toQuery({ programId, campusId })}`,
			{
				headers: buildArdHeaders(context),
			},
		);
		const data = getEnvelopeData(response);
		const courses = Array.isArray(data)
			? data
			: isRecord(data)
				? getArrayField(data, 'courses')
				: [];

		// Find the course and extract its sections with professors
		const course = courses.find((item) => isRecord(item) && item.courseId === courseId);
		const sections = course && isRecord(course) ? getArrayField(course, 'sections') : [];

		return withData(response, sections.map(normalizeProfessorOption));
	},

	exportActs(filters: ArdReportFilters): Promise<Blob> {
		return apiPostBlob(`${ARD_API_BASE}/reports/acts-by-program-course`, filters);
	},

	exportAttendance(filters: ArdReportFilters): Promise<Blob> {
		return apiPostBlob(`${ARD_API_BASE}/reports/attendance-list`, filters);
	},

	async exportReport(body: ArdExportRequest): Promise<{ blob: Blob; fileName: string }> {
		const { blob, response } = await apiPostBlobResponse(`${ARD_API_BASE}/export`, body);
		return { blob, fileName: resolveDownloadFileName(response, 'ard-report.xlsx') };
	},

	async exportAttendanceByArd(
		ardId: number,
		lang: 'es' | 'en',
	): Promise<{ blob: Blob; fileName: string }> {
		const { blob, response } = await apiPostBlobResponse(`${ARD_API_BASE}/attendance-export`, {
			ardId,
			lang,
		});
		return { blob, fileName: resolveDownloadFileName(response, 'ard-attendance.xlsx') };
	},
};
