import { RubricResponse } from '../types';
import { RubricListRow } from '../types/rubricListRow';
import { TYPE_CODES } from '@/modules/core';

export function mapRubricToRow(rubric: RubricResponse): RubricListRow {
	const course = rubric.study_plan_course?.course;
	const studyPlanAcademicPeriod = rubric.study_plan_course?.study_plan_academic_period;
	const gradeType = rubric.grade_type;
	const rubricType = rubric.rubric_type;

	const empty = { en: '', es: '' };

	return {
		id: rubric.id,
		courseLabel: course?.name ?? empty,
		periodLabel: studyPlanAcademicPeriod?.academic_period.code ?? empty,
		gradeTypeLabel: gradeType
			? {
					en: [gradeType.name.en].filter(Boolean).join(' · '),
					es: [gradeType.name.es].filter(Boolean).join(' · '),
				}
			: empty,
		gradeTypeCode: gradeType?.code ?? '',
		rubricTypeLabel: rubricType?.name ?? empty,
		isCapstone: rubric.rubric_type?.code === TYPE_CODES.RUBRIC_TYPE.CAPSTONE,
		canEdit: !rubric.isUsed,
		raw: rubric,
	};
}
