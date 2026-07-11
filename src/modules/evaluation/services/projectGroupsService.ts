import { ApiResponse } from '@/shared';
import { apiPost, apiPatch, apiDelete } from '@/shared/lib';
import type {
	CreateProjectGroupDto,
	FilterProjectGroupDto,
	ProjectGroup,
	UpdateProjectGroupDto,
} from '../types';

export const projectGroupsService = {
	getByFilters(filters: FilterProjectGroupDto = {}): Promise<ApiResponse<ProjectGroup[]>> {
		return apiPost('/project-groups/get-by-filters', filters);
	},

	create(body: CreateProjectGroupDto): Promise<ApiResponse<ProjectGroup>> {
		return apiPost('/project-groups/create', body);
	},

	update(id: string | number, body: UpdateProjectGroupDto): Promise<ApiResponse<ProjectGroup>> {
		return apiPatch(`/project-groups/update/${id}`, body);
	},

	remove(id: string | number): Promise<ApiResponse<void>> {
		return apiDelete(`/project-groups/delete/${id}`);
	},
};
