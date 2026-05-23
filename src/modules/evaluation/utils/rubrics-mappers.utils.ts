import { RubricResponse } from "../api/dtos"
import { RubricListRow } from "../types/rubric-list-row.type"

export function mapRubricToRow(rubric: RubricResponse): RubricListRow {
    const course = rubric.study_plan_course?.course
    const studyPlanAcademicPeriod = rubric.study_plan_course?.study_plan_academic_period
    const gradeType = rubric.grade_type
    const rubricType = rubric.rubric_type

    const empty = { en: '', es: '' }

    return {
        id: rubric.id,
        courseLabel: course?.name ?? empty,
        periodLabel: studyPlanAcademicPeriod?.id,
        gradeTypeLabel: gradeType
            ? {
                en: [gradeType.name.en].filter(Boolean).join(' · '),
                es: [gradeType.name.es].filter(Boolean).join(' · '),
              }
            : empty,
        rubricTypeLabel: rubricType?.name ?? empty,
        isCapstone: rubric.rubric_type_id === 29,
        canEdit: !rubric.isUsed,
        raw: rubric,
    }
}
