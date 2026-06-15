import { z } from 'zod';
import { MIN_PERFORMANCE_LEVEL, MAX_PERFORMANCE_LEVEL } from '../constants/competence';

export const competenceSchema = z.object({
	generalCompetence: z.string().min(1, { message: 'surveys.competence.toast.required' }),
	specificCompetence: z.string().default(''),
	description: z.string().min(1, { message: 'surveys.competence.toast.required' }),
	descriptionEn: z.string().optional().default(''),
	performanceLevel: z.number().int().min(MIN_PERFORMANCE_LEVEL).max(MAX_PERFORMANCE_LEVEL),
	isVisible: z.boolean().optional().default(true),
	outcomeId: z.number().optional(),
});

export type CompetenceSchemaInput = z.input<typeof competenceSchema>;
