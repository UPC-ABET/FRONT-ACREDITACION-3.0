import { z } from 'zod';

export const createPortfolioProjectSchema = z
	.object({
		name: z.string().min(1).max(255),
		description: z.string().min(1).max(5000),
		academicPeriodId: z.number({ error: 'Período académico requerido' }).int().positive(),
		modalityTypeId: z.number({ error: 'Modalidad requerida' }).int().positive(),
		programId: z.number({ error: 'Programa requerido' }).int().positive(),
		isFromUPC: z.boolean(),
		companyId: z.number().int().positive().optional(),
		companyCode: z.string().max(50).optional(),
		studentOneId: z.number().int().positive().optional(),
		studentTwoId: z.number().int().positive().optional(),
		courseSectionId: z.number().int().positive().optional(),
	})
	.refine((d) => d.companyId != null || (d.companyCode != null && d.companyCode.length > 0), {
		message: 'Se requiere companyId o companyCode',
		path: ['companyId'],
	});

export type CreatePortfolioProjectFormValues = z.infer<typeof createPortfolioProjectSchema>;

export const updateManagerProjectSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	problemSolved: z.string().min(1).max(5000),
	goal: z.string().min(1).max(5000),
	coauthorProfessorId: z.number().int().positive().nullable().optional(),
	consultantProfessorId: z.number().int().positive().nullable().optional(),
});

export type UpdateManagerProjectFormValues = z.infer<typeof updateManagerProjectSchema>;
