import { useMutation } from '@tanstack/react-query'
import { uploadStudentSections, rollbackStudentSectionsUpload } from '../services'
import type { UploadResult, RollbackPayload, StudentSectionsUploadPayload } from '../types'

export const useStudentSectionsUpload = () =>
  useMutation<UploadResult, Error, StudentSectionsUploadPayload>({ mutationFn: uploadStudentSections })

export const useRollbackStudentSectionsUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackStudentSectionsUpload })
