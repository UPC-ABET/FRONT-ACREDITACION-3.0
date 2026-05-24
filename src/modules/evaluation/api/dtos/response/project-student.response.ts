export type ProjectStudentInfoResponse = {
	first_name: string;
	last_name: string;
	student_id: number;
	section_code: string;
	section_id: number;
};

export type ProjectStudentResponse = {
	id: number;
	extra?: Record<string, unknown>;
	is_active: boolean;
	created_at: string;
	updated_at: string | null;
	project_id: number;
	student_section_enrollment_id: number;
	student_info?: ProjectStudentInfoResponse;
};

export {};
