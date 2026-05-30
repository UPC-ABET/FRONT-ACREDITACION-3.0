// Mirror of the backend UploadResult contract (uploads/sections).
export interface UploadResult {
  success: boolean
  message: string | null
  uploadLogId: number | null
  totalRows: number
  loadedRows: number
  errorRows: number
  // Annotated Excel (base64) with the MensajeError column when success = false.
  excelWithErrors: string | null
  fileName: string | null
}

export interface SectionsUploadPayload {
  file: File
  academicPeriodId: number
}

export interface RollbackPayload {
  uploadLogId: number
}
