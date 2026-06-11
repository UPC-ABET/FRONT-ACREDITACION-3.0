import { z } from 'zod';
import { createProjectSchema } from './createProjectSchema';

export const createProjectFullSchema = createProjectSchema.extend({
	studentSectionEnrollmentIds: z.array(z.number()).optional(),
	evaluatorProfessorIds: z.array(z.number()).optional(),
});

export type CreateProjectFullInput = z.infer<typeof createProjectFullSchema>;

export {};
