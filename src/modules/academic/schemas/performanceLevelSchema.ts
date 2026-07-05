import { z } from 'zod';

// Numeric fields allow '' so the input can be cleared without snapping back to 0.
const numericField = z.union([z.number(), z.literal('')]);

export const performanceLevelFormSchema = z.object({
	instrumentTypeId: z.number().int().positive(),
	academicPeriodId: z.number().int().positive(),
	nameEs: z.string().min(1),
	nameEn: z.string().min(1),
	code: z.string().min(1),
	uniqueValue: numericField,
	minScore: numericField,
	maxScore: numericField,
	maxValue: numericField,
	color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type PerformanceLevelFormState = z.infer<typeof performanceLevelFormSchema>;
