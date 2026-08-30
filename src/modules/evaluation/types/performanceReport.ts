export type PerformanceReportKind = 'rc' | 'rv';

export type PerformanceReportFormat = 'pdf' | 'excel';

export type PerformanceReportLang = 'es' | 'en';

export type PerformanceReportFilterDto = {
	programCommissionId?: number;
	// At most one campus on the download endpoints (pdf/excel): 2+ campuses are rejected with
	// 400 error.semaphoreReport.singleCampusRequired. Empty/omitted = consolidated report over
	// every campus. The JSON screen endpoints still accept any number.
	campusIds?: number[];
	// RC PDF download only: outcome IDs to report on. RC is generated one outcome at a time, so
	// the download is a zip with one PDF per outcome -- the selected ones, or every active outcome
	// of the selected commission when omitted. Ignored by RC Excel/JSON and by RV entirely.
	outcomeIds?: number[];
	// RV only: limits the report to grades whose rubric belongs to one of the selected grade
	// types (core.types group TG205). Empty/omitted = all grade types. Ignored by RC.
	gradeTypeIds?: number[];
	// RV only, DEPRECATED: legacy filter by rubric id. Kept for backend compatibility but no
	// longer surfaced in the UI (rubrics have no human-readable name); prefer gradeTypeIds.
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
	campus: string;
	academicPeriodCycle: string;
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
