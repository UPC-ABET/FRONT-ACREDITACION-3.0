export type PerformanceReportKind = 'rc' | 'rv';

export type PerformanceReportFormat = 'pdf' | 'excel';

export type PerformanceReportLang = 'es' | 'en';

export type PerformanceReportFilterDto = {
	academicPeriodId?: number;
	programCommissionId?: number;
	outcomeId?: number;
	campusId?: number;
	modalityTypeId?: number;
	// RV only: limits the report to grades produced by the selected rubrics. Ignored by RC.
	rubricIds?: number[];
	lang?: PerformanceReportLang;
};

export type PerformanceLevelLegendDto = {
	name: string;
	minScore: number;
	maxScore: number;
	color: string;
};

export type PerformanceCourseOutcomeSummaryDto = {
	sede: string;
	cicloAcademico: string;
	courseCode: string;
	courseName: string;
	outcomeCode: string;
	outcomeName: string;
	totalStudents: number;
	// Internal field names for the lowest/middle/highest performance levels (= legend[0/1/2]).
	// Never surfaced verbatim in the UI: render legend[i].name instead.
	studentsRed: number;
	studentsYellow: number;
	studentsGreen: number;
	percentageRed: number;
	percentageYellow: number;
	percentageGreen: number;
	isCritical: boolean;
	color: string;
};

export type PerformanceReportMetadataDto = {
	programName: string;
	commissionName: string;
	academicPeriodCode: string;
	accreditorCode: string;
};

export type PerformanceReportDto = {
	legend: PerformanceLevelLegendDto[];
	summary: PerformanceCourseOutcomeSummaryDto[];
	metadata: PerformanceReportMetadataDto;
};
