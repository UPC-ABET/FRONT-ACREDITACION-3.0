export type CommissionResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	accreditor_id: number;
	code: string;
	name: { en: string; es: string };
};

export type OutcomeResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	program_commission_id: number;
	program_commission?: {
		id: number;
		commission: CommissionResponse;
	};
	outcome_code: string;
	outcome_name: { en: string; es: string };
	outcome_description: { en: string; es: string };
};
