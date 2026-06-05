// ── Enums ─────────────────────────────────────────────────────────────────────

export const PORTFOLIO_STATUS = {
	APPROVED: 0,
	DISAPPROVED: 1,
	PENDING: 2,
	REVIEWED: 3,
	PRE_APPROVED: 4,
} as const;

export type PortfolioStatus = (typeof PORTFOLIO_STATUS)[keyof typeof PORTFOLIO_STATUS];

export const COLLABORATION_TYPE = {
	COAUTHOR: 0,
	CONSULTANT: 1,
} as const;

export type CollaborationType = (typeof COLLABORATION_TYPE)[keyof typeof COLLABORATION_TYPE];

// ── Request DTOs ──────────────────────────────────────────────────────────────

export type CreatePortfolioProjectDto = {
	name: string;
	description: string;
	academicPeriodId: number;
	modalityTypeId: number;
	isFromUPC: boolean;
	programId: number;
	companyId?: number;
	companyCode?: string;
	studentOneId?: number;
	studentTwoId?: number;
	courseSectionId?: number;
};

export type UpdatePortfolioProjectDto = Partial<{
	name: string;
	description: string;
	problemSolved: string;
	goal: string;
	isFromUPC: boolean;
	status: PortfolioStatus;
	studentOneId: number | null;
	studentTwoId: number | null;
	academicPeriodId: number;
	modalityTypeId: number;
	companyId: number;
	companyCode: string;
	programId: number;
	researchLineId: number;
	coauthorProfessorId: number | null;
	consultantProfessorId: number | null;
	courseSectionId: number;
}>;

export type UpdateManagerPortfolioProjectDto = {
	name: string;
	description?: string;
	problemSolved: string;
	goal: string;
	studentOneId?: number | null;
	studentTwoId?: number | null;
	coauthorProfessorId?: number | null;
	consultantProfessorId?: number | null;
};

export type FilterPortfolioProjectDto = Partial<{
	academicPeriodId: number;
	programId: number;
	programIds: number[];
	status: PortfolioStatus;
	studentCode: string;
	isFromUPC: boolean;
	modalityTypeId: number;
	assignment: boolean;
	courseSectionId: number;
	teacherCode: string;
	schoolId: number;
}>;

export type GetAllPortfolioProjectsBody = {
	page: {
		pageNumber: number;
		pageSize: number;
	};
	body: FilterPortfolioProjectDto;
};

export type ManagementAssignDto = {
	projectId: number;
	studentOneId: number;
	studentTwoId?: number;
	courseSectionId?: number;
};

export type AutoAssignPartnerDto = {
	modalityTypeId: number;
	courseSectionId: number;
};

export type MigrateProjectsDto = {
	originCourseSectionId: number;
	destinationCourseSectionId: number;
	newAcademicPeriodId: number;
	modalityTypeId: number;
};

export type CreatePortfolioCompanyDto = {
	name: string;
	code: string;
	isFromUPC: boolean;
	academicPeriodId: number;
	modalityTypeId: number;
};

export type CreatePortfolioResearchLineDto = {
	name: string;
	programId: number;
	modalityTypeId: number;
};

// ── Response Types ────────────────────────────────────────────────────────────

export type PortfolioStudentResponse = {
	id: number;
	firstName: string;
	lastName: string;
	studentCode: string;
	email?: string;
};

export type PortfolioProfessorResponse = {
	id: number;
	firstName?: string;
	lastName?: string;
	staffId?: number;
};

export type PortfolioCompanyResponse = {
	id: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	name: string;
	code: string;
	isFromUPC: boolean;
	academicPeriodId: number;
	modalityTypeId: number;
	extra?: Record<string, unknown>;
};

export type PortfolioResearchLineResponse = {
	id: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	name: string;
	programId: number;
	modalityTypeId: number;
	extra?: Record<string, unknown>;
};

export type PortfolioProjectResponse = {
	id: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	code: string;
	name: string;
	description?: string;
	problemSolved?: string;
	goal?: string;
	isFromUPC: boolean;
	status: PortfolioStatus;
	studentOneId?: number | null;
	studentTwoId?: number | null;
	academicPeriodId: number;
	modalityTypeId: number;
	companyId: number;
	courseSectionId?: number | null;
	researchLineId?: number | null;
	programId: number;
	coauthorProfessorId?: number | null;
	consultantProfessorId?: number | null;
	extra?: Record<string, unknown>;
	studentOne?: PortfolioStudentResponse | null;
	studentTwo?: PortfolioStudentResponse | null;
	company?: PortfolioCompanyResponse;
	researchLine?: PortfolioResearchLineResponse | null;
	applications?: PortfolioApplicationResponse[];
};

export type PaginatedPortfolioProjectsResponse = {
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	data: PortfolioProjectResponse[];
};

export type PortfolioApplicationResponse = {
	id: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	projectId: number;
	studentId: number;
	status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
	extra?: Record<string, unknown>;
	student?: PortfolioStudentResponse;
};

export type PortfolioTeacherByModalityResponse = {
	professorId: number;
	fullName: string;
	type: CollaborationType;
	total: number;
};

export type PortfolioTeacherTotalProjectsResponse = {
	coauthorTotal: number;
	consultantTotal: number;
};

export type BulkUploadPortfolioResponse = {
	success: boolean;
	errors: Array<{ row: number; message: string }>;
	inserted: number;
};
