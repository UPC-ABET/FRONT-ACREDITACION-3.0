import { z } from 'zod';
import { MIN_PERFORMANCE_LEVEL, MAX_PERFORMANCE_LEVEL } from '../constants/competence';

export const competenceSchema = z.object({
	generalCompetence: z.string().min(1, { message: 'surveys.competence.toast.requiredEs' }),
	specificCompetence: z.string().min(1, { message: 'surveys.competence.toast.requiredEn' }),
	description: z.string().min(1, { message: 'surveys.competence.toast.requiredDescEs' }),
	descriptionEn: z.string().min(1, { message: 'surveys.competence.toast.requiredDescEn' }),
	performanceLevel: z.number().int().min(MIN_PERFORMANCE_LEVEL).max(MAX_PERFORMANCE_LEVEL),
	isVisible: z.boolean().optional().default(true),
	isExternal: z.boolean().optional().default(false),
	outcomeId: z.number().optional(),
});

export type CompetenceSchemaInput = z.input<typeof competenceSchema>;
