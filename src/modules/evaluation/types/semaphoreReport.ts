export type SemaphoreColor = 'ROJO' | 'AMARILLO' | 'VERDE';

export type SemaphoreReportKind = 'rc' | 'rv';

export type SemaphoreReportFormat = 'pdf' | 'excel';

export type SemaphoreReportLang = 'es' | 'en';

export type SemaphoreFilterDto = {
	programCommissionId?: number;
	outcomeId?: number;
	campusId?: number;
	modalityTypeId?: number;
	lang?: SemaphoreReportLang;
};

export type SemaphoreReportSummaryDto = {
	courseCode: string;
	courseName: string;
	outcomeCode: string;
	outcomeName: string;
	totalStudents: number;
	studentsAchieved: number;
	percentageAchieved: number;
	color: SemaphoreColor;
	sede: string;
	cicloAcademico: string;
};

export type SemaphoreMetadataDto = {
	programName: string;
	commissionName: string;
	academicPeriodCode: string;
	accreditorCode: string;
};

export type SemaphoreReportDto = {
	summary: SemaphoreReportSummaryDto[];
	redDetail: SemaphoreReportSummaryDto[];
	yellowDetail: SemaphoreReportSummaryDto[];
	greenDetail: SemaphoreReportSummaryDto[];
	metadata: SemaphoreMetadataDto;
};
