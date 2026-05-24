export type EnrolledStudentResponse = {
	id: number; // enrolled_student_id
	student_section_enrollment_id: number;
	student_id: number;
	first_name: string;
	last_name: string;
	email: string;
	student_code: string;
	course_section_id: number;
	section_code: string;
	professor_id: number;
	professor_first_name: string;
	professor_last_name: string;
	campus_id: number;
	enrollment_date: string;
	is_active: boolean;
};

export {};
