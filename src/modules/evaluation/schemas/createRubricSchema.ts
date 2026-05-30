import { z } from 'zod';

export const createRubricSchema = z.object({
	rubricTypeId: z.number(),
	gradeTypeId: z.number(),
	studyPlanCourseId: z.number(),
});

export type CreateRubricInput = z.infer<typeof createRubricSchema>;

export {};
