// Direct-evaluation rubric for Capstone courses (RB grades).
// Mirrors the future evaluation.* tables in the backend (not yet implemented).

export interface CapstoneProject {
	id: number;
	code: string;
	name: string;
	courseSectionId: number;
	courseCode: string;
	sectionCode: string;
	totalStudents: number;
	gradedStudents: number;
}

export interface CapstoneRubricPerformanceLevel {
	id: number;
	code: string;
	name: string;
	minScore: number;
	maxScore: number;
}

export interface CapstoneRubricCriterion {
	id: number;
	code: string;
	outcomeId: number;
	outcomeCode: string;
	description: string;
	levels: CapstoneRubricPerformanceLevel[];
	// Per-criterion ceiling; the sum across all criteria of a rubric must equal RUBRIC_TOTAL_SCORE.
	maxScore: number;
}

export interface CapstoneRubric {
	id: number;
	projectId: number;
	criteria: CapstoneRubricCriterion[];
	expectedTotal: number;
}

export interface CapstoneStudentEvaluation {
	studentId: number;
	studentCode: string;
	studentName: string;
	scores: Record<number, number>;
	observation: string;
}

export interface SubmitCapstoneEvaluationPayload {
	projectId: number;
	rubricId: number;
	studentId: number;
	scores: Array<{ criterionId: number; score: number }>;
	observation: string;
}
