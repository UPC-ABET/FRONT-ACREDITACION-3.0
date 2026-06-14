import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/lib';
import type {
	StudyPlanCoursesViewData,
	StudyPlanMaintenanceCreate,
	StudyPlanMaintenanceItem,
	StudyPlanMaintenanceList,
	StudyPlanMaintenanceUpdate,
} from '../types';

export const studyPlansService = {
	// Modality travels as the X-Modality-Type-Id header (injected globally).
	maintenanceList(params: {
		page?: number;
		pageSize?: number;
		search?: string;
		programId?: number;
	}): Promise<ApiResponse<StudyPlanMaintenanceList>> {
		const query = new URLSearchParams();
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		if (params.programId != null) query.set('programId', String(params.programId));
		const qs = query.toString();
		return apiGet(`/study-plans/maintenance${qs ? `?${qs}` : ''}`);
	},

	maintenanceCreate(
		body: StudyPlanMaintenanceCreate,
	): Promise<ApiResponse<StudyPlanMaintenanceItem>> {
		return apiPost('/study-plans/maintenance', body);
	},

	maintenanceUpdate(
		id: number,
		body: StudyPlanMaintenanceUpdate,
	): Promise<ApiResponse<StudyPlanMaintenanceItem>> {
		return apiPut(`/study-plans/maintenance/${id}`, body);
	},

	maintenanceDelete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`/study-plans/maintenance/${id}`);
	},

	// Period travels as the X-Academic-Period-Id header (injected globally); courses are period-specific.
	getCoursesView(studyPlanId: number): Promise<ApiResponse<StudyPlanCoursesViewData>> {
		return apiGet(`/study-plans/maintenance/${studyPlanId}/courses`);
	},
};
