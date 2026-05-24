export type ProjectEvaluatorInfoResponse = {
	id: number;
	professor_id: number;
	first_name: string;
	last_name: string;
	email: string;
	evaluator_type: { en: string; es: string };
};

export type ProjectStudentInfoResponse = {
	id: number;
	first_name: string;
	last_name: string;
	email: string;
	student_code: string;
};

export type ProjectByProfessorResponse = {
	project_id: number;
	project_code: string;
	project_name: { en: string; es: string };
	evaluation_date: string;
	course_name: string;
	evaluators: ProjectEvaluatorInfoResponse[];
	students: ProjectStudentInfoResponse[];
};

export {};
