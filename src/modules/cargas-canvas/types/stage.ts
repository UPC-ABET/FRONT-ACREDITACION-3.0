// Hitos del ciclo académico (blueprint §4.2 stepper horizontal).
export const STAGES = ['PRE_ENROLL', 'START_TERM', 'END_TERM'] as const
export type StageCode = (typeof STAGES)[number]

// Registro de un flow soportado por la canvas (blueprint §4.2 selector radial).
export interface FlowDescriptor {
  code: string                // identificador interno (ej. 'sections', 'enrolled-students')
  stage: StageCode            // hito en que se habilita
  uploadType: string          // core.types/UPLOAD_TYPE — usado para filtrar el historial
  displayKey: string          // clave i18n del nombre visible
  expectedHeaders: string[]   // cabecera Excel esperada — pre-validation engine
  canBannerScrap: boolean     // ¿el flow tiene botón "Jalar de Banner"?
}
