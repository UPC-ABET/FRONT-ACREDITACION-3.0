import { z } from 'zod';

export const apiTokenScopeSchema = z.object({
	module: z.string().min(1),
	action: z.string().min(1),
});

export const apiTokenCreateFormSchema = z.object({
	name: z
		.string()
		.min(1, { message: 'admin.apiTokens.form.error.nameRequired' })
		.max(255, { message: 'admin.apiTokens.form.error.nameTooLong' }),
	scopes: z
		.array(apiTokenScopeSchema)
		.min(1, { message: 'admin.apiTokens.form.error.scopesRequired' }),
	expiresAt: z.string().datetime().optional(),
});

export type ApiTokenCreateFormState = z.infer<typeof apiTokenCreateFormSchema>;

export const apiTokenEditFormSchema = z.object({
	name: z
		.string()
		.min(1, { message: 'admin.apiTokens.form.error.nameRequired' })
		.max(255, { message: 'admin.apiTokens.form.error.nameTooLong' }),
	expiresAt: z.string().datetime().nullable().optional(),
});

export type ApiTokenEditFormState = z.infer<typeof apiTokenEditFormSchema>;
