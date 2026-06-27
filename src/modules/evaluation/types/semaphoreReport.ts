export type SemaphoreReportKind = 'rc' | 'rv';

export type SemaphoreReportFormat = 'pdf' | 'excel';

export type SemaphoreReportLang = 'es' | 'en';

export type SemaphoreFilterDto = {
	academicPeriodId?: number;
	programCommissionId?: number;
	outcomeId?: number;
	campusId?: number;
	modalityTypeId?: number;
	lang?: SemaphoreReportLang;
};

export type SemaphoreLevelLegendDto = {
	name: string;
	minScore: number;
	maxScore: number;
	color: string;
};

export type SemaphoreCourseOutcomeSummaryDto = {
	sede: string;
	cicloAcademico: string;
	courseCode: string;
	courseName: string;
	outcomeCode: string;
	outcomeName: string;
	totalStudents: number;
	studentsRed: number;
	studentsYellow: number;
	studentsGreen: number;
	percentageRed: number;
	percentageYellow: number;
	percentageGreen: number;
	isCritical: boolean;
	color: string;
};

export type SemaphoreMetadataDto = {
	programName: string;
	commissionName: string;
	academicPeriodCode: string;
	accreditorCode: string;
};

export type SemaphoreReportDto = {
	legend: SemaphoreLevelLegendDto[];
	summary: SemaphoreCourseOutcomeSummaryDto[];
	metadata: SemaphoreMetadataDto;
};
