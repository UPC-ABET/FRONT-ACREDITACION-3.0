import { useMutation } from '@tanstack/react-query'
import { uploadPpp, rollbackPppUpload } from '../services'
import type { UploadResult, RollbackPayload, PppUploadPayload } from '../types'

export const usePppUpload = () =>
  useMutation<UploadResult, Error, PppUploadPayload>({ mutationFn: uploadPpp })

export const useRollbackPppUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackPppUpload })
