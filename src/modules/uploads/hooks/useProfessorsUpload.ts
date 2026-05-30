import { useMutation } from '@tanstack/react-query'
import { uploadProfessors, rollbackProfessorsUpload } from '../services'
import type { UploadResult, RollbackPayload, ProfessorsUploadPayload } from '../types'

export const useProfessorsUpload = () =>
  useMutation<UploadResult, Error, ProfessorsUploadPayload>({ mutationFn: uploadProfessors })

export const useRollbackProfessorsUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackProfessorsUpload })
