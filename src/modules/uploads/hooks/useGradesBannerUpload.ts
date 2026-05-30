import { useMutation } from '@tanstack/react-query'
import { uploadGradesBanner, rollbackGradesBannerUpload } from '../services'
import type { UploadResult, RollbackPayload, GradesBannerUploadPayload } from '../types'

export const useGradesBannerUpload = () =>
  useMutation<UploadResult, Error, GradesBannerUploadPayload>({ mutationFn: uploadGradesBanner })

export const useRollbackGradesBannerUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackGradesBannerUpload })
