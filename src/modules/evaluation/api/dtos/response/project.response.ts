import { BaseEntity } from '@/shared';
import { ProjectStudentResponse } from './project-student.response';
import { ProjectEvaluatorResponse } from './project-evaluator.response';

export type ProjectResponse = BaseEntity & {
	code: string;
	name: { en: string; es: string };
	description?: { en: string; es: string };
	students?: ProjectStudentResponse[];
	evaluators?: ProjectEvaluatorResponse[];
};

export {};
