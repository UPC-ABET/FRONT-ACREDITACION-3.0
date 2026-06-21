// S3 has no real folders: a "folder" is a key ending with `/`. Files are keys
// that do not end with `/`.
export type S3Entry = {
	key: string;
	name: string;
	isFolder: boolean;
	size: number;
	lastModified: string | null;
};

export type S3ListResponse = {
	prefix: string;
	folders: S3Entry[];
	files: S3Entry[];
};

export type BreadcrumbSegment = {
	name: string;
	prefix: string;
};

export const PORTFOLIO_STATUS = {
	APPROVED: 'APPROVED',
	PRE_APPROVED: 'PRE_APPROVED',
	REVIEWED: 'REVIEWED',
	PENDING: 'PENDING',
	DISAPPROVED: 'DISAPPROVED',
} as const;
export type PortfolioStatus = (typeof PORTFOLIO_STATUS)[keyof typeof PORTFOLIO_STATUS];

export type ApplicationStatus = 'ACCEPTED' | 'REJECTED' | 'PENDING';

export type PortfolioStudentInfo = {
	id: number;
	firstName: string;
	lastName: string;
	studentCode: string;
	email?: string;
};

export type PortfolioApplicationResponse = {
	id: number;
	studentId: number;
	status: ApplicationStatus;
	student?: PortfolioStudentInfo;
};

export type PortfolioProjectResponse = {
	id: number;
	code: string;
	name: string;
	status: PortfolioStatus;
	description?: string;
	isFromUPC: boolean;
	problemSolved?: string;
	goal?: string;
	company?: { id: number; name: string };
	researchLine?: { id: number; name: string };
	studentOne?: PortfolioStudentInfo | null;
	studentTwo?: PortfolioStudentInfo | null;
	applications?: PortfolioApplicationResponse[];
};

export type PortfolioCompanyResponse = {
	id: number;
	code: string;
	name: string;
	academicPeriodId: number;
	modalityTypeId: number;
};

export type CreatePortfolioCompanyDto = {
	name: string;
	academicPeriodId: number;
	modalityTypeId: number;
};

export type PortfolioResearchLineResponse = {
	id: number;
	name: string;
	programId?: number;
	modalityTypeId?: number;
};

export type CreatePortfolioResearchLineDto = {
	name: string;
	programId?: number;
	modalityTypeId?: number;
};

export type FilterPortfolioProjectDto = {
	academicPeriodId?: number;
	modalityTypeId?: number;
	programId?: number;
	status?: PortfolioStatus;
	search?: string;
	managerId?: number;
};

export type CreatePortfolioProjectDto = {
	name: string;
	description?: string;
	academicPeriodId: number;
	modalityTypeId: number;
	programId?: number;
	companyId?: number;
	researchLineId?: number;
	isFromUPC?: boolean;
	problemSolved?: string;
	goal?: string;
};

export type UpdatePortfolioProjectDto = Partial<CreatePortfolioProjectDto>;

export type UpdateManagerPortfolioProjectDto = {
	managerId: number;
};

export type ManagementAssignDto = {
	projectId: number;
	managerId: number;
};

export type MigrateProjectsDto = {
	fromAcademicPeriodId: number;
	toAcademicPeriodId: number;
	modalityTypeId?: number;
};

export type PaginatedPortfolioProjectsResponse = {
	data: PortfolioProjectResponse[];
	totalCount: number;
	page: number;
	pageSize: number;
};

export type BulkUploadPortfolioResponse = {
	inserted: number;
	updated: number;
	errors: Array<{ row: number; message: string }>;
};

export type PortfolioTeacherByModalityResponse = {
	id: number;
	firstName: string;
	lastName: string;
	email?: string;
	totalProjects?: number;
};

export type PortfolioTeacherTotalProjectsResponse = {
	teacherId: number;
	totalProjects: number;
	modalityTypeId?: number;
};
