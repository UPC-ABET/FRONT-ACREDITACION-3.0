import { z } from 'zod';
import { createProjectSchema } from './createProjectSchema';

const evaluatorSchema = z.object({
	professorId: z.number(),
	evaluatorTypeId: z.number(),
});

export const createProjectFullSchema = createProjectSchema.extend({
	studentSectionEnrollmentIds: z.array(z.number()).optional(),
	evaluators: z.array(evaluatorSchema).optional(),
});

export type CreateProjectFullInput = z.infer<typeof createProjectFullSchema>;

export {};
