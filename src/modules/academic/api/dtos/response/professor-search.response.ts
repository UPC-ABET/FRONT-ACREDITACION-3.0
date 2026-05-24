export type ProfessorStaffUserResponse = {
	first_name: string;
	last_name: string;
};

export type ProfessorStaffResponse = {
	id: number;
	staff_email: string;
	staff_phone: string;
	job_title: { en: string; es: string };
	job_description: { en: string; es: string };
	user?: ProfessorStaffUserResponse;
};

export type ProfessorSearchResponse = {
	id: number;
	staff_id: number;
	staff: ProfessorStaffResponse;
};

export {};
