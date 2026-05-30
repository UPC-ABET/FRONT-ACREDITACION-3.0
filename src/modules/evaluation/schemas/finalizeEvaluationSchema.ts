import { z } from 'zod';

export const finalizeEvaluationSchema = z.object({
	projectId: z.number(),
	evaluatorId: z.number(),
	isPa: z.boolean().optional(),
});

export type FinalizeEvaluationInput = z.infer<typeof finalizeEvaluationSchema>;

export {};
