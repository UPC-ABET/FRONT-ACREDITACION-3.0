import { apiGet } from './apiClient'
import type { AcademicPeriod, Program } from '../types'

// ─── Shared helpers ───────────────────────────────────────────────────────────

interface BackendEntity {
  id: number
  code?: string
  codigo?: string
  name?: string | { es?: string; en?: string }
  nombre?: string
  is_active?: boolean
}

type Envelope<T> = T[] | { data?: T[] }

function unwrapList<T>(res: Envelope<T>): T[] {
  return Array.isArray(res) ? res : (res.data ?? [])
}

function adaptDisplayName(raw: BackendEntity): string {
  return (
    raw.nombre ??
    (typeof raw.name === 'string' ? raw.name : raw.name?.es) ??
    raw.code ??
    raw.codigo ??
    String(raw.id)
  )
}

// ─── Academic Periods ─────────────────────────────────────────────────────────

export async function getAcademicPeriods(): Promise<AcademicPeriod[]> {
  try {
    const res = await apiGet<Envelope<BackendEntity>>('academic-periods/get-all')
    return unwrapList(res).map((raw) => ({
      id: raw.id,
      nombre: adaptDisplayName(raw),
      codigo: raw.code ?? raw.codigo,
    }))
  } catch {
    return []
  }
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<Program[]> {
  try {
    const res = await apiGet<Envelope<BackendEntity>>('programs/get-all')
    return unwrapList(res).map((raw) => ({
      id: raw.id,
      nombre: adaptDisplayName(raw),
      codigo: raw.code ?? raw.codigo,
    }))
  } catch {
    return []
  }
}

// ─── Survey Type IDs (cached from /types/by-group-code/TG601) ────────────────
// The acceptance-levels endpoint requires survey_type_id (numeric FK to types table).
// We fetch the catalog once per session and cache it.

interface BackendType {
  id: number
  code: string
}

let _surveyTypeIds: Map<string, number> | null = null

export async function getSurveyTypeId(code: string): Promise<number> {
  if (!_surveyTypeIds) {
    try {
      const res = await apiGet<Envelope<BackendType>>('types/by-group-code/TG601')
      const list = unwrapList(res)
      _surveyTypeIds = new Map(list.map((t) => [t.code, t.id]))
    } catch {
      _surveyTypeIds = new Map()
    }
  }
  return _surveyTypeIds.get(code) ?? 0
}
