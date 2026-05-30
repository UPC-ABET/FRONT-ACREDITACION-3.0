'use client'

import {
  UPLOAD_TYPE_CODES,
  rollbackSectionsUpload,
  rollbackEnrolledStudentsUpload,
  rollbackProfessorsUpload,
  rollbackGradesRcUpload,
  rollbackStudentSectionsUpload,
  rollbackStudyPlansUpload,
  rollbackChartsUpload,
  rollbackOutcomesUpload,
  rollbackDelegatesUpload,
  rollbackPppUpload,
  rollbackScrapingBannerUpload,
  rollbackGradesBannerUpload,
} from '@/modules/uploads'
import UploadHistoryPage from './UploadHistoryPage'

// Container (smart component) for the upload history view: wires the decoupled
// UploadHistoryPage to the per-upload-type rollback services. The page itself stays
// presentational and unaware of the 12 endpoints.
const rollbackByUploadType: Record<string, (uploadLogId: number) => Promise<{ success: boolean }>> = {
  [UPLOAD_TYPE_CODES.SECCION]: (id) => rollbackSectionsUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.ALUMNOS_MATRICULADOS]: (id) => rollbackEnrolledStudentsUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.DOCENTE]: (id) => rollbackProfessorsUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.NOTAS_RC]: (id) => rollbackGradesRcUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.ALUMNOS_POR_SECCION]: (id) => rollbackStudentSectionsUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.MALLA_CURRICULAR]: (id) => rollbackStudyPlansUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.ORGANIGRAMA]: (id) => rollbackChartsUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.MALLA_COCOS]: (id) => rollbackOutcomesUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.DELEGADOS]: (id) => rollbackDelegatesUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.PPP]: (id) => rollbackPppUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.SCRAPING_BANNER]: (id) => rollbackScrapingBannerUpload({ uploadLogId: id }),
  [UPLOAD_TYPE_CODES.SCRAPING_BANNER_NOTAS]: (id) => rollbackGradesBannerUpload({ uploadLogId: id }),
}

export default function UploadHistoryPageContainer() {
  return <UploadHistoryPage rollbackByUploadType={rollbackByUploadType} />
}
