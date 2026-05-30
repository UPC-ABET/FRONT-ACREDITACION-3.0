import { apiPost, apiUploadFormData, getApiData } from '@/shared/lib/apiClient'
import type {
  UploadResult,
  SectionsUploadPayload,
  RollbackPayload,
  EnrolledStudentsUploadPayload,
  ProfessorsUploadPayload,
  GradesRcUploadPayload,
  StudentSectionsUploadPayload,
  PppUploadPayload,
  ScrapingBannerUploadPayload,
  GradesBannerUploadPayload,
  StudyPlansUploadPayload,
  ChartsUploadPayload,
  OutcomesUploadPayload,
  DelegatesUploadPayload,
} from '../types'

function buildForm(file: File, academicPeriodId: number): FormData {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('academic_period_id', String(academicPeriodId))
  return fd
}

// Multipart upload. The backend wraps the result in { code, message, data }, so we unwrap with getApiData.
// apiUploadFormData (not apiPost) is required: apiPost JSON.stringifies the body and would break the file upload.
function upload<P extends { file: File; academicPeriodId: number }>(path: string) {
  return async (payload: P): Promise<UploadResult> =>
    getApiData<UploadResult>(await apiUploadFormData(path, buildForm(payload.file, payload.academicPeriodId)))
}

function rollback(path: string) {
  return async (payload: RollbackPayload): Promise<{ success: boolean }> =>
    getApiData<{ success: boolean }>(
      await apiPost(`${path}/rollback`, { upload_log_id: payload.uploadLogId }),
    )
}

// A1 — Sections
export const uploadSections = upload<SectionsUploadPayload>('/uploads/sections/upload')
export const rollbackSectionsUpload = rollback('/uploads/sections')

// A2 — Enrolled Students
export const uploadEnrolledStudents = upload<EnrolledStudentsUploadPayload>('/uploads/enrolled-students/upload')
export const rollbackEnrolledStudentsUpload = rollback('/uploads/enrolled-students')

// A3 — Professors
export const uploadProfessors = upload<ProfessorsUploadPayload>('/uploads/professors/upload')
export const rollbackProfessorsUpload = rollback('/uploads/professors')

// A4 — RC Grades
export const uploadGradesRc = upload<GradesRcUploadPayload>('/uploads/grades-rc/upload')
export const rollbackGradesRcUpload = rollback('/uploads/grades-rc')

// A5 — Student×Section
export const uploadStudentSections = upload<StudentSectionsUploadPayload>('/uploads/student-sections/upload')
export const rollbackStudentSectionsUpload = rollback('/uploads/student-sections')

// B1 — PPP
export const uploadPpp = upload<PppUploadPayload>('/uploads/ppp/upload')
export const rollbackPppUpload = rollback('/uploads/ppp')

// C1+C2 — Scraping Banner
export const uploadScrapingBanner = upload<ScrapingBannerUploadPayload>('/uploads/scraping-banner/upload')
export const rollbackScrapingBannerUpload = rollback('/uploads/scraping-banner')

// C3 — Banner Grades
export const uploadGradesBanner = upload<GradesBannerUploadPayload>('/uploads/grades-banner/upload')
export const rollbackGradesBannerUpload = rollback('/uploads/grades-banner')

// D1 — Study Plan
export const uploadStudyPlans = upload<StudyPlansUploadPayload>('/uploads/study-plans/upload')
export const rollbackStudyPlansUpload = rollback('/uploads/study-plans')

// D2 — Org Chart
export const uploadCharts = upload<ChartsUploadPayload>('/uploads/charts/upload')
export const rollbackChartsUpload = rollback('/uploads/charts')

// D3 — Outcomes (COCO map)
export const uploadOutcomes = upload<OutcomesUploadPayload>('/uploads/outcomes/upload')
export const rollbackOutcomesUpload = rollback('/uploads/outcomes')

// D4 — Delegates
export const uploadDelegates = upload<DelegatesUploadPayload>('/uploads/delegates/upload')
export const rollbackDelegatesUpload = rollback('/uploads/delegates')
