// Vista 4.4 — Consola de Evaluación Directa Capstone (Notas RB).
// Espejo de las entidades futuras de evaluation.* en el back (módulo NO implementado
// en esta sesión — ver README). Los shapes están listos para conectar cuando exista.

export interface CapstoneProject {
  id: number
  code: string
  name: string
  course_section_id: number
  course_code: string
  section_code: string
  // Progreso de evaluación (vista 4.4.1 círculo SVG): X de Y alumnos calificados.
  total_students: number
  graded_students: number
}

// Definición de una rúbrica Capstone — filas (criterios) × columnas (niveles de desempeño).
export interface RubricCriterion {
  id: number
  code: string
  // Outcome al que apunta este criterio (matriz outcome × criterio).
  outcome_id: number
  outcome_code: string
  description: string
  // Niveles de desempeño con rango de puntaje.
  levels: RubricPerformanceLevel[]
  // Puntaje máximo posible — la suma sobre todos los criterios debe ser exactamente 20.
  max_score: number
}

export interface RubricPerformanceLevel {
  id: number
  code: string
  name: string
  min_score: number
  max_score: number
}

export interface CapstoneRubric {
  id: number
  project_id: number
  criteria: RubricCriterion[]
  // Suma esperada de max_score sobre todos los criterios (regla de negocio: 20).
  expected_total: number
}

// Estado de evaluación in-memory por alumno (vista 4.4.3 — sliders + suma live).
export interface StudentEvaluation {
  student_id: number
  student_code: string
  student_name: string
  scores: Record<number, number>   // criterion_id → puntaje seleccionado
  observation: string              // ≥ 50 chars para habilitar guardado
}

export interface SubmitEvaluationPayload {
  project_id: number
  rubric_id: number
  student_id: number
  scores: Array<{ criterion_id: number; score: number }>
  observation: string
}
