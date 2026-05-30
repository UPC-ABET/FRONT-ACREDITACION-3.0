// UPLOAD_TYPE codes — mirror of core.types group UPLOAD_TYPE (backend).
export const UPLOAD_TYPE_CODES = {
  SECCION: 'SECCION',
  ALUMNOS_MATRICULADOS: 'ALUMNOS_MATRICULADOS',
  DOCENTE: 'DOCENTE',
  NOTAS_RC: 'NOTASRC',
  ALUMNOS_POR_SECCION: 'ALUMNOS_POR_SECCION',
  MALLA_CURRICULAR: 'MALLA_CURRICULAR',
  ORGANIGRAMA: 'ORGANIGRAMA',
  MALLA_COCOS: 'MALLA_COCOS',
  DELEGADOS: 'DELEGADOS',
  PPP: 'PPP',
  SCRAPING_BANNER: 'SCRAPING_BANNER',
  SCRAPING_BANNER_NOTAS: 'SCRAPING_BANNER_NOTAS',
} as const

export type UploadTypeCode = (typeof UPLOAD_TYPE_CODES)[keyof typeof UPLOAD_TYPE_CODES]

// Expected Excel columns for the Sections upload (order matters — mirrors SectionsFileModel).
export const SECTION_COLUMNS = ['CodigoCurso', 'Seccion', 'Docente', 'Local', 'TipoEstudio'] as const
