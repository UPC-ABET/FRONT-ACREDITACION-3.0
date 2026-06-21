import { z } from 'zod';
import { rubricCriteriaSchema } from './criteriaSchema';

export const rubricQuestionSchema = z.object({
	outcomeId: z.number().nullable().optional(),
	question: z.string(),
	criterias: z.array(rubricCriteriaSchema),
});

export type RubricQuestionInput = z.infer<typeof rubricQuestionSchema>;

export {};
