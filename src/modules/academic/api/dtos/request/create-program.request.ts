export type CreateProgramRequest = {
	extra?: Record<string, unknown>;
	is_active?: boolean;
	modality_type_id: number;
	name: string;
	degree: string;
};
