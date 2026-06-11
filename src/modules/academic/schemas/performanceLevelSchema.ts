import { z } from 'zod';

export const performanceLevelFormSchema = z.object({
	instrumentTypeId: z.number().int().positive(),
	academicPeriodId: z.number().int().positive(),
	nameEs: z.string().min(1),
	nameEn: z.string().min(1),
	code: z.string().min(1),
	uniqueValue: z.number(),
	minScore: z.number().min(0),
	maxScore: z.number().min(0),
	maxValue: z.number().min(0),
	color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type PerformanceLevelFormState = z.infer<typeof performanceLevelFormSchema>;
