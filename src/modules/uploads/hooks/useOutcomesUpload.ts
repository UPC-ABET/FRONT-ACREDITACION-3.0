import { useMutation } from '@tanstack/react-query'
import { uploadOutcomes, rollbackOutcomesUpload } from '../services'
import type { UploadResult, RollbackPayload, OutcomesUploadPayload } from '../types'

export const useOutcomesUpload = () =>
  useMutation<UploadResult, Error, OutcomesUploadPayload>({ mutationFn: uploadOutcomes })

export const useRollbackOutcomesUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackOutcomesUpload })
