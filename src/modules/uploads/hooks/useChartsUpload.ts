import { useMutation } from '@tanstack/react-query'
import { uploadCharts, rollbackChartsUpload } from '../services'
import type { UploadResult, RollbackPayload, ChartsUploadPayload } from '../types'

export const useChartsUpload = () =>
  useMutation<UploadResult, Error, ChartsUploadPayload>({ mutationFn: uploadCharts })

export const useRollbackChartsUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackChartsUpload })
