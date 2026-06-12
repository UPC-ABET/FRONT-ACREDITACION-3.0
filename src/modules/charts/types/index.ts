export type I18nText = { es: string; en: string };

export type ChartEntityTypeRef = {
	id: number;
	code: string;
	name: I18nText;
};

export type ChartEntityRef = {
	code: string;
	name: I18nText;
};

export type ChartNode = {
	chartId: number;
	staffId: number;
	professorCode: string | null;
	firstName: string;
	lastName: string;
	staffTitle: I18nText;
	organizationLevelTitle: I18nText;
	entityType: ChartEntityTypeRef | null;
	entity: ChartEntityRef | null;
	children: ChartNode[];
};

export type ChartCreatePayload = {
	rootChartId: number;
	staffId: number;
	title: I18nText;
	entityTypeId: number;
	entityCode?: number;
};

export type ChartUpdatePayload = {
	staffId?: number;
	title?: I18nText;
	entityTypeId?: number;
	entityCode?: number;
};

export type StaffLookupItem = {
	id: number;
	professorCode: string | null;
	firstName: string;
	lastName: string;
	jobTitle: I18nText | null;
	label: string;
};

export type CourseLookupItem = {
	id: number;
	code: string;
	name: I18nText;
};

export type ProgramItem = {
	id: number;
	code: string;
	name: I18nText;
};

export type PaginatedResult<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
};
