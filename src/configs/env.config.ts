import { z } from 'zod';

const envSchema = z.object({
	NEXT_PUBLIC_API_URL: z.string().min(1),
	NEXT_PUBLIC_PORTFOLIO_URL: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(): Env {
	if (cachedEnv) return cachedEnv;

	const result = envSchema.safeParse(process.env);
	if (!result.success) {
		const invalidKeys = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
		throw new Error(
			`Invalid or missing environment variables:\n` +
				invalidKeys.map((key) => `   - ${key}`).join('\n') +
				`\n\nDefine them in your .env file before starting the server.`,
		);
	}

	cachedEnv = result.data;
	return cachedEnv;
}
