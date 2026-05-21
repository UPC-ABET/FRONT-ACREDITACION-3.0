import { z } from 'zod'

export const createProjectSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export {}
