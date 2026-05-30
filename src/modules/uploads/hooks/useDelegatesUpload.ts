import { useMutation } from '@tanstack/react-query'
import { uploadDelegates, rollbackDelegatesUpload } from '../services'
import type { UploadResult, RollbackPayload, DelegatesUploadPayload } from '../types'

export const useDelegatesUpload = () =>
  useMutation<UploadResult, Error, DelegatesUploadPayload>({ mutationFn: uploadDelegates })

export const useRollbackDelegatesUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackDelegatesUpload })
