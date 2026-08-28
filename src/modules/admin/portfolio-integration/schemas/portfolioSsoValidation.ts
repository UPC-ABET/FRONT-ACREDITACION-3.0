import { z } from 'zod';

export const portfolioSsoConfigFormSchema = z.object({
	baseUrl: z.string().url({ message: 'admin.portfolioIntegration.form.error.baseUrlInvalid' }),
	apiKey: z.string().min(32, { message: 'admin.portfolioIntegration.form.error.apiKeyInvalid' }),
});

export type PortfolioSsoConfigFormState = z.infer<typeof portfolioSsoConfigFormSchema>;
