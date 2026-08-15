import { z } from 'zod';
import { MIN_PERFORMANCE_LEVEL } from '../constants/competence';

export const competenceSchema = z.object({
	generalCompetence: z.string().min(1, { message: 'surveys.competence.toast.requiredEs' }),
	specificCompetence: z.string().min(1, { message: 'surveys.competence.toast.requiredEn' }),
	description: z.string().min(1, { message: 'surveys.competence.toast.requiredDescEs' }),
	descriptionEn: z.string().min(1, { message: 'surveys.competence.toast.requiredDescEn' }),
	performanceLevel: z.number().int().min(MIN_PERFORMANCE_LEVEL),
	isVisible: z.boolean().optional().default(true),
	// A real outcome must always be linked (business rule: outcome_id is never null);
	// General vs Específica is resolved server-side from that outcome's commission type.
	outcomeId: z.number({ error: 'surveys.competence.toast.requiredOutcome' }),
});

export type CompetenceSchemaInput = z.input<typeof competenceSchema>;
