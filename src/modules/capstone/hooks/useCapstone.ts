import { useMutation, useQuery } from '@tanstack/react-query'
import { listProjects, getRubric, submitEvaluation } from '../services'
import type { CapstoneProject, CapstoneRubric, SubmitEvaluationPayload } from '../types'

export const useCapstoneProjects = (professorId: number | null) =>
  useQuery<CapstoneProject[], Error>({
    queryKey: ['capstone', 'projects', professorId],
    queryFn: () => listProjects(professorId as number),
    enabled: professorId !== null,
  })

export const useCapstoneRubric = (projectId: number | null) =>
  useQuery<CapstoneRubric, Error>({
    queryKey: ['capstone', 'rubric', projectId],
    queryFn: () => getRubric(projectId as number),
    enabled: projectId !== null,
  })

export const useSubmitEvaluation = () =>
  useMutation<{ id: number }, Error, SubmitEvaluationPayload>({
    mutationFn: submitEvaluation,
  })
