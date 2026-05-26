export type EvaluationScorePayload = {
	rubric_question_criteria_id: number;
	score: number;
	commentaries: Record<string, string>;
};

export type SubmitEvaluationPayload = {
	project_student_id: number;
	project_evaluator_id: number;
	rubric_id: number;
	observation: { es: string; en: string };
	scores: EvaluationScorePayload[];
	qualification_status_type_id?: number | null;
};
