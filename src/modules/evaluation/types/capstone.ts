// Direct-evaluation rubric for Capstone courses (Notas RB).
// Mirrors the future evaluation.* tables in the backend (not yet implemented).

export interface CapstoneProject {
	id: number;
	code: string;
	name: string;
	course_section_id: number;
	course_code: string;
	section_code: string;
	total_students: number;
	graded_students: number;
}

export interface CapstoneRubricPerformanceLevel {
	id: number;
	code: string;
	name: string;
	min_score: number;
	max_score: number;
}

export interface CapstoneRubricCriterion {
	id: number;
	code: string;
	outcome_id: number;
	outcome_code: string;
	description: string;
	levels: CapstoneRubricPerformanceLevel[];
	// Per-criterion ceiling; the sum across all criteria of a rubric must equal RUBRIC_TOTAL_SCORE.
	max_score: number;
}

export interface CapstoneRubric {
	id: number;
	project_id: number;
	criteria: CapstoneRubricCriterion[];
	expected_total: number;
}

export interface CapstoneStudentEvaluation {
	student_id: number;
	student_code: string;
	student_name: string;
	// criterion_id -> selected score.
	scores: Record<number, number>;
	observation: string;
}

export interface SubmitCapstoneEvaluationPayload {
	project_id: number;
	rubric_id: number;
	student_id: number;
	scores: Array<{ criterion_id: number; score: number }>;
	observation: string;
}
