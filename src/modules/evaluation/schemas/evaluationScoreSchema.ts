import { z } from 'zod';

export const evaluationScoreSchema = z.object({
	rubricQuestionCriteriaId: z.number(),
	score: z.number(),
	commentaries: z.string().optional(),
});

export type EvaluationScoreInput = z.infer<typeof evaluationScoreSchema>;

export {};
