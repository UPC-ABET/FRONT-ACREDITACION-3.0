'use client'

import { useState, useCallback } from 'react'
import type { AcademicPeriod, CompetenceConfig, AcceptanceLevel, CompetenceFormData, DashboardResponse } from '../types'
import {
  getAcademicPeriods,
  listPPPCompetences,
  savePPPCompetence,
  deletePPPCompetence,
  clonePPPConfiguration,
  listAcceptanceLevels,
  updateAcceptanceLevels,
  downloadPPPTemplate,
  uploadPPPMassive,
  generatePPPPerceptionReport,
} from '../services'

// Backward-compat alias: components that import usePPPCycles still work.
// load() ignores the optional modalityId arg; periods come from getAcademicPeriods().
export function usePPPCycles() {
  const { periods, loading, error, load: _load } = usePPPPeriods()
  const load = useCallback((_modalityId?: unknown) => { _load() }, [_load])
  return { cycles: periods, loading, error, load }
}

export function usePPPPeriods() {
  const [periods, setPeriods] = useState<AcademicPeriod[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setPeriods(await getAcademicPeriods())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { periods, loading, error, load }
}

export function usePPPCompetences() {
  const [competences, setCompetences] = useState<CompetenceConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (idPeriodo: number, idCarrera = 0) => {
    setLoading(true)
    setError(null)
    try {
      setCompetences(await listPPPCompetences(idPeriodo, idCarrera))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (data: CompetenceFormData, onSuccess?: () => void) => {
    try {
      await savePPPCompetence(data)
      onSuccess?.()
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const remove = useCallback(async (id: number, onSuccess?: () => void) => {
    try {
      await deletePPPCompetence(id)
      onSuccess?.()
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const clone = useCallback(
    async (
      params: {
        idCarreraOrigen: number
        idPeriodoOrigen: number
        idCarreraDestino: number
        idPeriodoDestino: number
      },
      onSuccess?: () => void
    ) => {
      try {
        await clonePPPConfiguration(params)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  return { competences, loading, error, load, save, remove, clone, setError }
}

export function usePPPAcceptanceLevels() {
  const [levels, setLevels] = useState<AcceptanceLevel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (idPeriodo: number) => {
    setLoading(true)
    setError(null)
    try {
      setLevels(await listAcceptanceLevels(idPeriodo))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(
    async (idPeriodo: number, niveles: AcceptanceLevel[], onSuccess?: () => void) => {
      try {
        await updateAcceptanceLevels(idPeriodo, niveles)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  return { levels, setLevels, loading, error, load, save }
}

export function usePPPDownload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const download = useCallback(async (idPeriodo: number) => {
    setLoading(true)
    setError(null)
    try {
      await downloadPPPTemplate(idPeriodo)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, download }
}

export function usePPPUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const upload = useCallback(
    async (
      file: File,
      academic_period_id: number,
      program_id = 0,
      campus_id = 0
    ) => {
      setLoading(true)
      setError(null)
      setSuccess(false)
      try {
        await uploadPPPMassive(file, academic_period_id, program_id, campus_id)
        setSuccess(true)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { loading, error, success, upload, reset: () => setSuccess(false) }
}

export function usePPPReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<DashboardResponse | null>(null)

  const generate = useCallback(
    async (params: {
      idPeriodoAcademico?: number
      idCarrera?: number
      idComision?: number
    }) => {
      setLoading(true)
      setError(null)
      try {
        setReportData(await generatePPPPerceptionReport(params))
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { loading, error, reportData, generate }
}
