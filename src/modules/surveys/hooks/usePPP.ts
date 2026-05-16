'use client'

import { useState, useCallback } from 'react'
import type { CompetenceConfig, AcceptanceLevel, CompetenceFormData } from '../types'
import {
  listPPPCompetences,
  savePPPCompetence,
  deletePPPCompetence,
  clonePPPConfiguration,
  listAcceptanceLevels,
  updateAcceptanceLevels,
  downloadPPPTemplate,
  uploadPPPMassive,
  generatePPPPerceptionReport,
  getCycleList,
} from '../services'

export function usePPPCycles() {
  const [cycles, setCycles] = useState<Array<{ id: number; nombre: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (modalityId?: string | number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCycleList(modalityId)
      setCycles(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { cycles, loading, error, load }
}

export function usePPPCompetences() {
  const [competences, setCompetences] = useState<CompetenceConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (idPeriodo: number, idCarrera = 0) => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPPPCompetences(idPeriodo, idCarrera)
      setCompetences(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(
    async (data: CompetenceFormData, onSuccess?: () => void) => {
      try {
        await savePPPCompetence(data)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

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
      const data = await listAcceptanceLevels(idPeriodo)
      setLevels(data)
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

  const upload = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const escuelaActual =
        typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem('escuela') ?? 'null')
          : null
      await uploadPPPMassive(file, escuelaActual ?? undefined)
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, success, upload, reset: () => setSuccess(false) }
}

export function usePPPReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<{
    pdfFiles?: Array<{ fileName: string; base64Content: string }>
    zipFile?: { base64Content: string; fileName: string }
  } | null>(null)

  const generate = useCallback(
    async (params: {
      idPeriodoAcademico?: number
      idCarrera?: number
      idComision?: number
    }) => {
      setLoading(true)
      setError(null)
      try {
        const res = await generatePPPPerceptionReport(params)
        setReportData(res.data ?? null)
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
