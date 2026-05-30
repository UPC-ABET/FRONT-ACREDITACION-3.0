import { useMutation } from '@tanstack/react-query'
import { uploadGradesRc, rollbackGradesRcUpload } from '../services'
import type { UploadResult, RollbackPayload, GradesRcUploadPayload } from '../types'

export const useGradesRcUpload = () =>
  useMutation<UploadResult, Error, GradesRcUploadPayload>({ mutationFn: uploadGradesRc })

export const useRollbackGradesRcUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackGradesRcUpload })
