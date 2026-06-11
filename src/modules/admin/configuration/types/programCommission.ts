export interface ProgramCommissionAssociation {
	id: number;
	programId: number;
	commissionId: number;
	academicPeriodId: number;
	commissionTypeId: number;
	isActive: boolean;
	extra: Record<string, unknown>;
	createdAt: string;
	updatedAt: string | null;
}

export interface AssociateProgramCommissionPayload {
	programId: number;
	commissionId: number;
	academicPeriodId: number;
	commissionTypeId: number;
}
