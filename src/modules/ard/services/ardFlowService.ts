import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/lib';
import type {
	ArdBulkDetailsBody,
	ArdClassRepresentative,
	ArdCourseProfessor,
	ArdMaintenanceList,
	ArdMaintenanceParams,
	ArdProgramCourse,
	ArdView,
	CreateArdBody,
	UpdateArdBody,
} from '../types';

const ARD_FLOW_BASE = '/ards';

export const ardFlowService = {
	maintenance(params: ArdMaintenanceParams): Promise<ApiResponse<ArdMaintenanceList>> {
		const query = new URLSearchParams();
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.campusId != null) query.set('campusId', String(params.campusId));
		if (params.programId != null) query.set('programId', String(params.programId));
		if (params.meetingDate) query.set('meetingDate', params.meetingDate);
		if (params.search) query.set('search', params.search);
		const qs = query.toString();
		return apiGet(`${ARD_FLOW_BASE}/maintenance${qs ? `?${qs}` : ''}`);
	},

	getById(id: number): Promise<ApiResponse<ArdView>> {
		return apiGet(`${ARD_FLOW_BASE}/get-by-id/${id}`);
	},

	create(body: CreateArdBody): Promise<ApiResponse<ArdView>> {
		return apiPost(`${ARD_FLOW_BASE}/create`, body);
	},

	update(id: number, body: UpdateArdBody): Promise<ApiResponse<ArdView>> {
		return apiPut(`${ARD_FLOW_BASE}/update/${id}`, body);
	},

	remove(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`${ARD_FLOW_BASE}/delete/${id}`);
	},

	bulkDetails(body: ArdBulkDetailsBody): Promise<ApiResponse<ArdView>> {
		return apiPost(`${ARD_FLOW_BASE}/details/bulk`, body);
	},

	classRepresentatives(params: {
		programId: number;
		campusId: number;
	}): Promise<ApiResponse<ArdClassRepresentative[]>> {
		const query = new URLSearchParams({
			programId: String(params.programId),
			campusId: String(params.campusId),
		});
		return apiGet(`${ARD_FLOW_BASE}/class-representatives?${query.toString()}`);
	},

	programCourses(params: { programId: number }): Promise<ApiResponse<ArdProgramCourse[]>> {
		const query = new URLSearchParams({ programId: String(params.programId) });
		return apiGet(`${ARD_FLOW_BASE}/program-courses?${query.toString()}`);
	},

	courseProfessors(params: {
		courseId: number;
		campusId: number;
	}): Promise<ApiResponse<ArdCourseProfessor[]>> {
		const query = new URLSearchParams({
			courseId: String(params.courseId),
			campusId: String(params.campusId),
		});
		return apiGet(`${ARD_FLOW_BASE}/course-professors?${query.toString()}`);
	},
};
