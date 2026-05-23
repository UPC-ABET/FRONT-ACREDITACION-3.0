import { apiGet } from './apiClient'
import type { AcademicPeriod, Program } from '../types'

// NOTE: These endpoints belong to the academic module.
// Adjust the paths to match whatever route your backend exposes for periods/programs.
const PERIODS_PATH = 'academic-periods'
const PROGRAMS_PATH = 'programs'

export async function getAcademicPeriods(): Promise<AcademicPeriod[]> {
  try {
    const res = await apiGet<AcademicPeriod[] | { data?: AcademicPeriod[]; resource?: AcademicPeriod[] }>(PERIODS_PATH)
    if (Array.isArray(res)) return res
    const obj = res as { data?: AcademicPeriod[]; resource?: AcademicPeriod[] }
    return obj.data ?? obj.resource ?? []
  } catch {
    return []
  }
}

export async function getPrograms(): Promise<Program[]> {
  try {
    const res = await apiGet<Program[] | { data?: Program[]; resource?: Program[] }>(PROGRAMS_PATH)
    if (Array.isArray(res)) return res
    const obj = res as { data?: Program[]; resource?: Program[] }
    return obj.data ?? obj.resource ?? []
  } catch {
    return []
  }
}
