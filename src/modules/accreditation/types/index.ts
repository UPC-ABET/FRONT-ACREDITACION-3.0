export type FilterCommissionRequest = Partial<{
	isActive: boolean;
	accreditorId: number;
	code: string;
	name: { es?: string; en?: string };
}>;

export type CommissionResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	accreditorId: number;
	code: string;
	name: { en: string; es: string };
};

export type OutcomeResponse = {
	id: number;
	extra?: Record<string, unknown>;
	isActive: boolean;
	createdAt: string;
	updatedAt: string | null;
	programCommissionId: number;
	programCommission?: {
		id: number;
		commission: CommissionResponse;
	};
	outcomeCode: string;
	outcomeName: { en: string; es: string };
	outcomeDescription: { en: string; es: string };
};

export type OutcomeMaintenanceItem = {
	id: number;
	commissionCode: string;
	outcomeCode: string;
	outcomeName: { es: string; en: string };
	outcomeDescription: { es: string; en: string };
};

export type OutcomeMaintenanceList = {
	items: OutcomeMaintenanceItem[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type OutcomeMaintenanceUpdate = {
	outcomeCode?: string;
	outcomeName?: { es: string; en: string };
	outcomeDescription?: { es: string; en: string };
};

export type OutcomeMaintenanceCreate = {
	outcomeCode: string;
	outcomeName: { es: string; en: string };
	outcomeDescription?: { es: string; en: string };
	programId: number;
	commissionId: number;
};

export type OutcomeCommissionOption = {
	id: number;
	code: string;
	name: { es: string; en: string };
	accreditorId: number;
};

export type OutcomeConversion = {
	id: number;
	sourceProgramCommissionId: number;
	sourceCommissionCode: string;
	targetProgramCommissionId: number;
	targetCommissionCode: string;
	targetOutcomeId: number;
	targetOutcomeCode: string;
	formula: string;
	referencedOutcomeCodes: string[];
	isActive: boolean;
};

export type OutcomeConversionFilters = {
	sourceProgramCommissionId?: number;
	targetProgramCommissionId?: number;
	academicPeriodId?: number;
};

export type OutcomeConversionCreate = {
	sourceProgramCommissionId: number;
	targetProgramCommissionId: number;
	targetOutcomeId: number;
	formula: string;
};

export type OutcomeConversionUpdate = {
	formula: string;
};

export type OutcomeConversionCoverage = {
	targetProgramCommissionId: number;
	targetCommissionCode: string;
	totalOutcomes: number;
	mappedOutcomes: number;
	missingOutcomeCodes: string[];
};
