import { z } from 'zod';

export const performanceLevelFormSchema = z.object({
	instrument_type_id: z.number().int().positive(),
	academic_period_id: z.number().int().positive(),
	name_es: z.string().min(1),
	name_en: z.string().min(1),
	code: z.string().min(1),
	unique_value: z.number(),
	min_score: z.number().min(0),
	max_score: z.number().min(0),
	max_value: z.number().min(0),
	color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type PerformanceLevelFormState = z.infer<typeof performanceLevelFormSchema>;
