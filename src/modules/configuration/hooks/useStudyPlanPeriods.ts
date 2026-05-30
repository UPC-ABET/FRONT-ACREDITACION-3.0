import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listStudyPlansByPeriod, associateStudyPlan, unassociateStudyPlan } from '../services'
import { CONFIG_QUERY_KEYS } from '../constants'
import type { StudyPlanPeriod, AssociateStudyPlanResponse, AssociateStudyPlanPayload } from '../types'

export const useStudyPlanPeriods = (periodId: number | null) =>
  useQuery<StudyPlanPeriod[], Error>({
    queryKey: periodId ? CONFIG_QUERY_KEYS.studyPlansByPeriod(periodId) : ['configuration', 'study-plans', 'noop'],
    queryFn: () => (periodId ? listStudyPlansByPeriod(periodId) : Promise.resolve([])),
    enabled: !!periodId,
  })

export const useAssociateStudyPlan = (periodId: number | null) => {
  const queryClient = useQueryClient()
  return useMutation<AssociateStudyPlanResponse, Error, AssociateStudyPlanPayload>({
    mutationFn: associateStudyPlan,
    onSuccess: () => {
      if (periodId) queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.studyPlansByPeriod(periodId) })
    },
  })
}

export const useUnassociateStudyPlan = (periodId: number | null) => {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean; deleted_courses: number }, Error, AssociateStudyPlanPayload>({
    mutationFn: unassociateStudyPlan,
    onSuccess: () => {
      if (periodId) queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.studyPlansByPeriod(periodId) })
    },
  })
}
