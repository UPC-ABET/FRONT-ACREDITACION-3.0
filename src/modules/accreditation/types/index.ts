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
