import { RubricResponse } from '../services/types';

export type RubricListRow = {
	id: number;
	courseLabel: { en: string; es: string };
	periodLabel: string;
	gradeTypeLabel: { en: string; es: string };
	gradeTypeCode: string;
	rubricTypeLabel: { en: string; es: string };
	isCapstone: boolean;
	canEdit: boolean;
	raw: RubricResponse;
};
