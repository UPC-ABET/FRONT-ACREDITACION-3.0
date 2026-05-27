import { z } from 'zod';

export const createRubricSchema = z.object({
	rubric_type_id: z.number(),
	grade_type_id: z.number(),
	study_plan_course_id: z.number(),
});

export type CreateRubricInput = z.infer<typeof createRubricSchema>;

export {};
