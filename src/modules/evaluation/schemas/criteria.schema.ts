import { z } from 'zod';

export const rubricCriteriaSchema = z.object({
	criteria: z.string(),
	minValue: z.number(),
	maxValue: z.number(),
});

export type RubricCriteriaInput = z.infer<typeof rubricCriteriaSchema>;

export {};
