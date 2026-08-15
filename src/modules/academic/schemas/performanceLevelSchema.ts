import { z } from 'zod';

// Numeric fields allow '' so the input can be cleared without snapping back to 0, but negative
// values are never valid.
const numericField = z
	.union([z.number(), z.literal('')])
	.refine((v) => v === '' || v >= 0, { message: 'performanceLevels.form.minZeroError' });

export const performanceLevelFormSchema = z.object({
	instrumentTypeId: z
		.number()
		.int()
		.positive({ message: 'performanceLevels.form.instrumentRequired' }),
	academicPeriodId: z.number().int().positive(),
	nameEs: z.string().min(1, { message: 'performanceLevels.form.nameEsRequired' }),
	nameEn: z.string().min(1, { message: 'performanceLevels.form.nameEnRequired' }),
	code: z.string().min(1, { message: 'performanceLevels.form.codeRequired' }),
	uniqueValue: numericField,
	minScore: numericField,
	maxScore: numericField,
	maxValue: numericField,
	color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'performanceLevels.form.colorInvalid' }),
});

export type PerformanceLevelFormState = z.infer<typeof performanceLevelFormSchema>;
