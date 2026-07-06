type I18nText = { es: string; en: string };

export type ProjectGroup = {
	id: number;
	code: string;
	name: I18nText;
	description: I18nText | null;
	academicPeriodId: number;
	programId: number;
	isActive: boolean;
	extra?: Record<string, unknown>;
	// Present in get-by-filters (join): useful for displaying program/period in tables.
	program?: { id: number; code: string; name: I18nText };
	academicPeriod?: { id: number; code: string };
	createdAt: string;
	updatedAt: string | null;
};

export type CreateProjectGroupDto = {
	code: string;
	name: I18nText;
	description?: I18nText;
	academicPeriodId: number;
	programId: number;
	isActive?: boolean;
	extra?: Record<string, unknown>;
};

export type UpdateProjectGroupDto = Partial<CreateProjectGroupDto>;

export type FilterProjectGroupDto = {
	code?: string;
	academicPeriodId?: number;
	programId?: number;
	isActive?: boolean;
};
