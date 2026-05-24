export type CreateProjectDto = {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
};

export {};
