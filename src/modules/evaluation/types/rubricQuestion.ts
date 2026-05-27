import { QuestionCriteria } from './questionCriteria';

export type RubricQuestion = {
	id: string | null;
	order: number;
	questionText: { en: string; es: string };
	criteria: QuestionCriteria[];
};
