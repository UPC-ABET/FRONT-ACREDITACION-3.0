import { z } from 'zod';
import { evaluationScoreSchema } from './evaluationScoreSchema';

export const submitEvaluationSchema = z.object({
	project_student_id: z.number(),
	project_evaluator_id: z.number(),
	observation: z.string().optional(),
	scores: z.array(evaluationScoreSchema),
});

export type SubmitEvaluationInput = z.infer<typeof submitEvaluationSchema>;

export {};
