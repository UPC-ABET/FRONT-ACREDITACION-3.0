export interface ConfigurationPeriod {
	id: number;
	code: string;
	startDate: string;
	endDate: string;
	modalityTypeId: number;
	isActive: boolean;
	extra: Record<string, unknown>;
	createdAt: string;
	updatedAt: string | null;
}

export interface CreatePeriodPayload {
	code: string;
	startDate: string;
	endDate: string;
	modalityTypeId: number;
}
