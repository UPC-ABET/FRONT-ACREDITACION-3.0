import { useMutation } from '@tanstack/react-query'
import { uploadScrapingBanner, rollbackScrapingBannerUpload } from '../services'
import type { UploadResult, RollbackPayload, ScrapingBannerUploadPayload } from '../types'

export const useScrapingBannerUpload = () =>
  useMutation<UploadResult, Error, ScrapingBannerUploadPayload>({ mutationFn: uploadScrapingBanner })

export const useRollbackScrapingBannerUpload = () =>
  useMutation<{ success: boolean }, Error, RollbackPayload>({ mutationFn: rollbackScrapingBannerUpload })
