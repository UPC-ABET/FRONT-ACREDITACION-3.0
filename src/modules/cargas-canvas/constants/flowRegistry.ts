import type { FlowDescriptor } from '../types'

// Registro central de los 12 flows. Mapea cada uno a su hito y su cabecera Excel esperada.
// La cabecera se compara case-insensitive con la primera fila del archivo subido (pre-validation §4.2.3).
export const FLOW_REGISTRY: FlowDescriptor[] = [
  // PRE_ENROLL — Antes de matrícula
  { code: 'professors',         stage: 'PRE_ENROLL', uploadType: 'DOCENTE',           displayKey: 'cargasCanvas.flow.professors',         expectedHeaders: ['UserName', 'Name'], canBannerScrap: false },
  { code: 'outcomes',           stage: 'PRE_ENROLL', uploadType: 'MALLA_COCOS',          displayKey: 'cargasCanvas.flow.outcomes',           expectedHeaders: ['Acreditadora', 'Comision', 'Carrera', 'CodigoMalla', 'CodigoCurso', 'OutcomeCode', 'OutcomeNameEn', 'OutcomeDescription', 'OutcomeType'], canBannerScrap: false },
  { code: 'study-plans',        stage: 'PRE_ENROLL', uploadType: 'MALLA_CURRICULAR',  displayKey: 'cargasCanvas.flow.studyPlans',         expectedHeaders: ['CodigoMalla', 'NombreMalla', 'CodigoCarrera', 'CodigoCurso', 'NombreCurso', 'EsElectivo', 'NivelCurso', 'Requisitos'], canBannerScrap: false },

  // START_TERM — Inicio de ciclo
  { code: 'charts',             stage: 'START_TERM', uploadType: 'ORGANIGRAMA',        displayKey: 'cargasCanvas.flow.charts',             expectedHeaders: ['EntityCode', 'Name', 'Level', 'EntityType', 'Responsible', 'Campus', 'ParentEntityCode'], canBannerScrap: false },
  { code: 'sections',           stage: 'START_TERM', uploadType: 'SECCION',            displayKey: 'cargasCanvas.flow.sections',           expectedHeaders: ['CodigoCurso', 'Seccion', 'Docente', 'Local', 'TipoEstudio'], canBannerScrap: true },
  { code: 'enrolled-students',  stage: 'START_TERM', uploadType: 'ALUMNOS_MATRICULADOS', displayKey: 'cargasCanvas.flow.enrolledStudents', expectedHeaders: ['CodigoAlumno', 'NombreCompleto', 'Carrera', 'EstadoMatricula', 'Sede'], canBannerScrap: true },
  { code: 'student-sections',   stage: 'START_TERM', uploadType: 'ALUMNOS_POR_SECCION',     displayKey: 'cargasCanvas.flow.studentSections',    expectedHeaders: ['CodigoCurso', 'CodigoSeccion', 'CodigoAlumno'], canBannerScrap: true },
  { code: 'delegates',          stage: 'START_TERM', uploadType: 'DELEGADOS',          displayKey: 'cargasCanvas.flow.delegates',          expectedHeaders: ['CodigoCurso', 'CodigoSeccion', 'CodigoAlumno'], canBannerScrap: false },

  // END_TERM — Cierre
  { code: 'grades-rc',          stage: 'END_TERM',   uploadType: 'NOTASRC',           displayKey: 'cargasCanvas.flow.gradesRc',           expectedHeaders: ['CodigoCurso', 'CodigoSeccion', 'CodigoAlumno', 'NotaParcial', 'NotaFinal', 'NotaFDM', 'NotaReal'], canBannerScrap: true },
  { code: 'grades-banner',      stage: 'END_TERM',   uploadType: 'SCRAPING_BANNER_NOTAS', displayKey: 'cargasCanvas.flow.gradesBanner',    expectedHeaders: ['CodigoAlumno', 'CursoCodigo', 'Nrc', 'TipoNota', 'Nota', 'Peso'], canBannerScrap: true },
  { code: 'ppp',                stage: 'END_TERM',   uploadType: 'PPP',                displayKey: 'cargasCanvas.flow.ppp',                expectedHeaders: ['SurveyType', 'SurveyStatus', 'CodigoAlumno', 'PeriodoCode', 'CampusCode', 'ProgramCode', 'NroEncuesta', 'RazonSocial', 'NombreJefe', 'CargoJefe', 'TelefonoJefe', 'CorreoJefe', 'RUC', 'TotalHoras', 'NumeroInforme', 'FechaInicio', 'FechaFin', 'Comentario', 'OutcomeCode', 'Score'], canBannerScrap: false },
  { code: 'scraping-banner',    stage: 'END_TERM',   uploadType: 'SCRAPING_BANNER',    displayKey: 'cargasCanvas.flow.scrapingBanner',     expectedHeaders: ['CodigoAlumno', 'Nombres', 'Apellidos', 'CorreoInstitucional', 'CorreoPersonal', 'TelefonoMovil', 'ProgramaCodigo', 'NivelCodigo', 'PeriodoCodigo', 'CampusCodigo', 'MetodoEducativoCodigo', 'Nrc', 'CursoCodigoFull', 'DocenteIdBanner'], canBannerScrap: true },
]

export const FLOWS_BY_STAGE = FLOW_REGISTRY.reduce<Record<string, FlowDescriptor[]>>((acc, flow) => {
  ;(acc[flow.stage] ??= []).push(flow)
  return acc
}, {})

export const findFlow = (code: string) => FLOW_REGISTRY.find((f) => f.code === code)
