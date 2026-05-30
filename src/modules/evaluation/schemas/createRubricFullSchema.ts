import { z } from 'zod';
import { rubricQuestionSchema } from './question.schema';

export const createRubricFullSchema = z.object({
	rubricTypeId: z.number(),
	gradeTypeId: z.number(),
	studyPlanCourseId: z.number(),
	questions: z.array(rubricQuestionSchema),
});

export type CreateRubricFullInput = z.infer<typeof createRubricFullSchema>;

export {};
