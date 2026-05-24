import { z } from 'zod';
import { rubricQuestionSchema } from './question.schema';

export const createRubricFullSchema = z.object({
	rubric_type_id: z.number(),
	grade_type_id: z.number(),
	study_plan_course_id: z.number(),
	questions: z.array(rubricQuestionSchema),
});

export type CreateRubricFullInput = z.infer<typeof createRubricFullSchema>;

export {};
