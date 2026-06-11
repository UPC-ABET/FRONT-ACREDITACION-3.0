import { RubricResponse } from '../types';
import { RubricListRow } from '../types/rubricListRow';
import { TYPE_CODES } from '@/shared/constants';

export function mapRubricToRow(rubric: RubricResponse): RubricListRow {
	const course = rubric.studyPlanCourse?.course;
	const studyPlanAcademicPeriod = rubric.studyPlanCourse?.studyPlanAcademicPeriod;
	const gradeType = rubric.gradeType;
	const rubricType = rubric.rubricType;

	const empty = { en: '', es: '' };

	return {
		id: rubric.id,
		courseLabel: course?.name ?? empty,
		periodLabel: studyPlanAcademicPeriod?.academicPeriod.code ?? empty,
		gradeTypeLabel: gradeType
			? {
					en: [gradeType.name.en].filter(Boolean).join(' · '),
					es: [gradeType.name.es].filter(Boolean).join(' · '),
				}
			: empty,
		gradeTypeCode: gradeType?.code ?? '',
		rubricTypeLabel: rubricType?.name ?? empty,
		isCapstone: rubric.rubricType?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE,
		canEdit: !rubric.isUsed,
		raw: rubric,
	};
}
