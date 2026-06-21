import {
	apiDelete,
	apiGet,
	apiGetBlobResponse,
	apiPost,
	apiPostBlobResponse,
	apiPut,
	apiUploadFormData,
} from '@/shared/lib';
import { parseFilename } from '@/shared/utils';
import type {
	BulkUploadPortfolioResponse,
	CreatePortfolioProjectDto,
	FilterPortfolioProjectDto,
	ManagementAssignDto,
	MigrateProjectsDto,
	PaginatedPortfolioProjectsResponse,
	PortfolioApplicationResponse,
	PortfolioProjectResponse,
	PortfolioTeacherByModalityResponse,
	PortfolioTeacherTotalProjectsResponse,
	UpdateManagerPortfolioProjectDto,
	UpdatePortfolioProjectDto,
} from '../types';

export const portfolioProjectsService = {
	getAll(
		filters: FilterPortfolioProjectDto = {},
		page = 1,
		pageSize = 20,
	): Promise<PaginatedPortfolioProjectsResponse> {
		const body = { ...filters };
		delete body.academicPeriodId;
		return apiPost('/portfolio/get-all', {
			page: { pageNumber: page, pageSize },
			body,
		});
	},

	getById(id: number | string): Promise<PortfolioProjectResponse> {
		return apiGet(`/portfolio/get-by-id/${id}`);
	},

	create(dto: CreatePortfolioProjectDto): Promise<PortfolioProjectResponse> {
		return apiPost('/portfolio/create', dto);
	},

	update(id: number | string, dto: UpdatePortfolioProjectDto): Promise<PortfolioProjectResponse> {
		return apiPut(`/portfolio/update/${id}`, dto);
	},

	updateManager(
		id: number | string,
		dto: UpdateManagerPortfolioProjectDto,
	): Promise<PortfolioProjectResponse> {
		return apiPut(`/portfolio/update-manager/${id}`, dto);
	},

	delete(id: number | string): Promise<void> {
		return apiDelete(`/portfolio/delete/${id}`);
	},

	unassignStudent(
		projectId: number | string,
		studentId: number | string,
	): Promise<PortfolioProjectResponse> {
		return apiDelete(`/portfolio/unassign-student/${projectId}/${studentId}`);
	},

	managementAssign(dto: ManagementAssignDto): Promise<PortfolioProjectResponse> {
		return apiPost('/portfolio/management-assign', dto);
	},

	autoAssignPartner(
		modalityTypeId: number,
		courseSectionId: number,
	): Promise<{ assigned: number }> {
		return apiPost('/portfolio/auto-assign-partner', { modalityTypeId, courseSectionId });
	},

	migrate(dto: MigrateProjectsDto): Promise<{ migrated: number }> {
		return apiPut('/portfolio/migrate', dto);
	},

	getTeachersByModality(modalityTypeId: number): Promise<PortfolioTeacherByModalityResponse[]> {
		return apiGet(`/portfolio/get-teachers-by-modality/${modalityTypeId}`);
	},

	getTeacherTotalProjects(
		professorId: number | string,
		modalityTypeId?: number,
	): Promise<PortfolioTeacherTotalProjectsResponse> {
		const qs = modalityTypeId != null ? `?modalityTypeId=${modalityTypeId}` : '';
		return apiGet(`/portfolio/get-teacher-total-projects/${professorId}${qs}`);
	},

	getApplications(projectId: number | string): Promise<PortfolioApplicationResponse[]> {
		return apiGet(`/portfolio/get-applications/${projectId}`);
	},

	createApplication(
		projectId: number | string,
		studentId: number | string,
	): Promise<PortfolioApplicationResponse> {
		return apiPost(`/portfolio/create-application/${projectId}/${studentId}`);
	},

	deleteApplication(applicationId: number | string): Promise<void> {
		return apiDelete(`/portfolio/delete-application/${applicationId}`);
	},

	async bulkUpload(
		academicPeriodId: number,
		modalityTypeId: number,
		file: File,
	): Promise<BulkUploadPortfolioResponse> {
		const formData = new FormData();
		formData.append('file', file);
		return apiUploadFormData(
			`/portfolio/bulk-upload/${academicPeriodId}/${modalityTypeId}`,
			formData,
		);
	},

	async bulkUploadFilled(
		academicPeriodId: number,
		modalityTypeId: number,
		courseSectionId: number,
		file: File,
	): Promise<BulkUploadPortfolioResponse> {
		const formData = new FormData();
		formData.append('file', file);
		return apiUploadFormData(
			`/portfolio/bulk-upload/filled/${academicPeriodId}/${modalityTypeId}/${courseSectionId}`,
			formData,
		);
	},

	async downloadTemplate(): Promise<void> {
		const { blob, response } = await apiGetBlobResponse('/portfolio/bulk-upload/template-file');
		const filename = parseFilename(
			response.headers.get('Content-Disposition'),
			'portfolio_template.xlsx',
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	},

	async downloadFilledTemplate(): Promise<void> {
		const { blob, response } = await apiGetBlobResponse(
			'/portfolio/bulk-upload/filled-template-file',
		);
		const filename = parseFilename(
			response.headers.get('Content-Disposition'),
			'portfolio_filled_template.xlsx',
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	},

	async export(filters: FilterPortfolioProjectDto = {}): Promise<void> {
		const body = { ...filters };
		delete body.academicPeriodId;
		const { blob, response } = await apiPostBlobResponse('/portfolio/export', {
			page: { pageNumber: 1, pageSize: 99999 },
			body,
		});
		const filename = parseFilename(
			response.headers.get('Content-Disposition'),
			'portfolio_export.xlsx',
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	},
};
