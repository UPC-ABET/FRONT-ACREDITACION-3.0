import { z } from 'zod'
import { createProjectSchema } from './create-project.schema'

export const createProjectFullSchema = createProjectSchema.extend({
  student_section_enrollment_ids: z.array(z.number()).optional(),
  evaluator_professor_ids: z.array(z.number()).optional(),
})

export type CreateProjectFullInput = z.infer<typeof createProjectFullSchema>

export {}
