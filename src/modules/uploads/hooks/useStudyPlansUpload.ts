import { useMutation } from '@tanstack/react-query'
import { uploadStudyPlans, rollbackStudyPlansUpload } from '../services'
import type { UploadResult, RollbackPayload, StudyPlansUploadPayload } from '../types'

export const useStudyPlansUpload = () =>
  useMutation<UploadResult, Error, StudyPlansUploadPayload>({ mutationFn: uploadStudyPlans })

export const useRollbackStudyPlansUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackStudyPlansUpload })
