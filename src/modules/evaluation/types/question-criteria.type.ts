export type QuestionCriteria = {
	id: string | null;
	criteriaText: { en: string; es: string };
	minValue: number | '';
	maxValue: number | '';
};
