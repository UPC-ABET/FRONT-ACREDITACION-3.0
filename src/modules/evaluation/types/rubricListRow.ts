import { RubricResponse } from '.';

export type RubricListRow = {
	id: number;
	programLabel: { en: string; es: string };
	courseLabel: { en: string; es: string };
	periodLabel: string;
	gradeTypeLabel: { en: string; es: string };
	gradeTypeCode: string;
	rubricTypeLabel: { en: string; es: string };
	isCapstone: boolean;
	canEdit: boolean;
	raw: RubricResponse;
};
