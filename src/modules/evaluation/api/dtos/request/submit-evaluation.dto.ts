import type { EvaluationScoreDto } from './evaluation-score.dto';

export type SubmitEvaluationDto = {
	project_student_id: number;
	project_evaluator_id: number;
	observation?: string;
	scores: EvaluationScoreDto[];
};

export {};
