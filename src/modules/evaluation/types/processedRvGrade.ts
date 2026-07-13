export type ProcessedRvGradeFilterDto = {
	programCommissionId?: number;
	outcomeId?: number;
	courseSectionId?: number;
	isConverted?: boolean;
};

export type ProcessedRvGradeDto = {
	id: number;
	studentSectionEnrollmentId: number;
	studentCode: string;
	studentName: string;
	courseCode: string;
	outcomeCode: string;
	commissionCode: string;
	// Raw grade when graded; result of the conversion formula when converted.
	grade: number;
	// Scaled to /20 and clamped — this is the value the semaphore classifies.
	scaledGrade: number;
	levelRank: number | null;
	levelName: string;
	isConverted: boolean;
	formula: string | null;
	sourceCommissionCode: string | null;
};

export type RvGradeRebuildResultDto = {
	evaluationsProcessed: number;
	gradedRows: number;
	convertedRows: number;
	// Formulas that could not be computed because the rubric did not grade every outcome they
	// reference; those conversions are skipped instead of being stored as a zero.
	skippedConversions: number;
};
