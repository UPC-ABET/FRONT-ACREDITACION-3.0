'use client'

import { RubricEditor } from '../components/rubric-editor'
import { RubricDetail } from '../types'

interface RubricEditorPageProps {
  rubricId: string
  initialRubric?: RubricDetail
}

export function RubricEditorPage({ rubricId, initialRubric }: RubricEditorPageProps) {
  return <RubricEditor rubricId={rubricId} initialRubric={initialRubric} />
}
