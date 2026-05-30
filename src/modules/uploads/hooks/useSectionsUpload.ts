import { useMutation } from '@tanstack/react-query'
import { uploadSections, rollbackSectionsUpload } from '../services'
import type { UploadResult, SectionsUploadPayload, RollbackPayload } from '../types'

// Triggers the Sections bulk upload. On row errors the backend returns success=false
// plus the annotated Excel (base64) so the caller can offer it for download.
export const useSectionsUpload = () => {
  return useMutation<UploadResult, Error, SectionsUploadPayload>({
    mutationFn: uploadSections,
  })
}

export const useRollbackSectionsUpload = () => {
  return useMutation<{ success: boolean }, Error, RollbackPayload>({
    mutationFn: rollbackSectionsUpload,
  })
}

// Turns the base64 Excel returned on error into a browser download.
export const downloadErrorExcel = (base64: string, fileName: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
