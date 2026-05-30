import { useMutation } from '@tanstack/react-query'
import { uploadEnrolledStudents, rollbackEnrolledStudentsUpload } from '../services'
import type { UploadResult, RollbackPayload, EnrolledStudentsUploadPayload } from '../types'

export const useEnrolledStudentsUpload = () =>
  useMutation<UploadResult, Error, EnrolledStudentsUploadPayload>({ mutationFn: uploadEnrolledStudents })

export const useRollbackEnrolledStudentsUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackEnrolledStudentsUpload })
