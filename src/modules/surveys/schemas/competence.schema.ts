import { z } from 'zod';
import { MIN_ACCEPTANCE_LEVEL, MAX_ACCEPTANCE_LEVEL } from '../constants/competence';

export const competenceSchema = z.object({
	generalCompetence: z.string().min(1, { message: 'surveys.competence.toast.required' }),
	specificCompetence: z.string().default(''),
	description: z.string().min(1, { message: 'surveys.competence.toast.required' }),
	acceptanceLevel: z
		.number()
		.int()
		.min(MIN_ACCEPTANCE_LEVEL)
		.max(MAX_ACCEPTANCE_LEVEL),
});

export type CompetenceSchemaInput = z.input<typeof competenceSchema>;
