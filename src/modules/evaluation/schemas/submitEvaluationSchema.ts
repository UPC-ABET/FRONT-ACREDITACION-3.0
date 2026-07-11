import { z } from 'zod';
import { evaluationScoreSchema } from './evaluationScoreSchema';

export const submitEvaluationSchema = z.object({
	projectStudentId: z.number(),
	projectEvaluatorId: z.number(),
	observation: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
	scores: z.array(evaluationScoreSchema),
});

export type SubmitEvaluationInput = z.infer<typeof submitEvaluationSchema>;

export {};
