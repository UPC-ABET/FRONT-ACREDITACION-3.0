export type StudyPlanResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	program_id: number;
	code: string;
	name: { en: string; es: string };
	description: { en: string; es: string };
};
