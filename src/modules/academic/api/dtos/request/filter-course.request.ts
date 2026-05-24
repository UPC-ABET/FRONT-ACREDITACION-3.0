export type FilterCourseRequest = Partial<{
	extra: Record<string, unknown>;
	is_active: boolean;
	code: string;
	name: { es?: string; en?: string };
	description: { es?: string; en?: string };
	learning_outcome: { es?: string; en?: string };
	academic_period_id: number;
	program_id: number;
	school_id: number;
}>;
