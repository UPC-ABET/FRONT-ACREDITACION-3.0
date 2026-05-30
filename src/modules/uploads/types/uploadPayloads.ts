// Shared payload types for all upload flows.
// UploadResult and RollbackPayload are already in sectionsUpload.ts and re-exported from index.

export interface EnrolledStudentsUploadPayload {
  file: File
  academicPeriodId: number
}

export interface ProfessorsUploadPayload {
  file: File
  academicPeriodId: number
}

export interface GradesRcUploadPayload {
  file: File
  academicPeriodId: number
}

export interface StudentSectionsUploadPayload {
  file: File
  academicPeriodId: number
}

export interface PppUploadPayload {
  file: File
  academicPeriodId: number
}

export interface ScrapingBannerUploadPayload {
  file: File
  academicPeriodId: number
}

export interface GradesBannerUploadPayload {
  file: File
  academicPeriodId: number
}

export interface StudyPlansUploadPayload {
  file: File
  academicPeriodId: number
}

export interface ChartsUploadPayload {
  file: File
  academicPeriodId: number
}

export interface OutcomesUploadPayload {
  file: File
  academicPeriodId: number
}

export interface DelegatesUploadPayload {
  file: File
  academicPeriodId: number
}
