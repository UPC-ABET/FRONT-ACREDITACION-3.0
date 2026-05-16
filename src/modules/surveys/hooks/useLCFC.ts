'use client'

import { useState, useCallback } from 'react'
import type { LCFCCourse, LCFCStudent, LCFCEmailParam, LCFCSendRequest } from '../types'
import {
  listLCFCCourses,
  generateLCFCConfiguration,
  cloneLCFCConfiguration,
  changeLCFCConfigStatus,
  listLCFCStudents,
  getLCFCEmailParams,
  sendLCFCEmail,
  downloadLCFCTemplate,
  uploadLCFCMassive,
  generateLCFCPerceptionReport,
  getCycleList,
} from '../services'

export function useLCFCCycles() {
  const [cycles, setCycles] = useState<Array<{ id: number; nombre: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (modalityId?: string | number) => {
    setLoading(true)
    setError(null)
    try {
      setCycles(await getCycleList(modalityId))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { cycles, loading, error, load }
}

export function useLCFCConfiguration() {
  const [courses, setCourses] = useState<LCFCCourse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (idEscuela: string, idPeriodo: number) => {
    setLoading(true)
    setError(null)
    try {
      const { cursos } = await listLCFCCourses(idEscuela, idPeriodo)
      setCourses(cursos)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const generate = useCallback(
    async (escuela: string, periodo: number, onSuccess?: () => void) => {
      try {
        await generateLCFCConfiguration(escuela, periodo)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  const clone = useCallback(
    async (idPeriodoOrigen: number, idPeriodoDestino: number, onSuccess?: () => void) => {
      try {
        await cloneLCFCConfiguration(idPeriodoOrigen, idPeriodoDestino)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  const changeStatus = useCallback(
    async (
      idConfiguracion: number,
      nuevoEstado: 'ACTIVO' | 'INACTIVO',
      onSuccess?: () => void
    ) => {
      try {
        await changeLCFCConfigStatus(idConfiguracion, nuevoEstado)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  return { courses, loading, error, load, generate, clone, changeStatus }
}

export function useLCFCStudents() {
  const [students, setStudents] = useState<LCFCStudent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (idCiclo: number, idPeriodo: number, page = 0) => {
    setLoading(true)
    setError(null)
    try {
      const { estudiantes, totalRegistros } = await listLCFCStudents(idCiclo, idPeriodo, page)
      setStudents(estudiantes)
      setTotal(totalRegistros)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { students, total, loading, error, load }
}

export function useLCFCEmail() {
  const [params, setParams] = useState<LCFCEmailParam[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadParams = useCallback(async () => {
    setLoading(true)
    try {
      setParams(await getLCFCEmailParams())
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const send = useCallback(async (request: LCFCSendRequest, onSuccess?: () => void) => {
    setSending(true)
    setError(null)
    try {
      await sendLCFCEmail(request)
      onSuccess?.()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }, [])

  return { params, loading, sending, error, loadParams, send }
}

export function useLCFCUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const downloadTemplate = useCallback(async (idPeriodo: number) => {
    setError(null)
    try {
      await downloadLCFCTemplate(idPeriodo)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const upload = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const escuelaActual =
        typeof localStorage !== 'undefined'
          ? JSON.parse(localStorage.getItem('escuela') ?? 'null')
          : null
      await uploadLCFCMassive(file, escuelaActual ?? undefined)
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, success, downloadTemplate, upload }
}

export function useLCFCReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<{
    pdfFiles?: Array<{ fileName: string; base64Content: string }>
  } | null>(null)

  const generate = useCallback(
    async (params: {
      idPeriodoAcademico?: number
      idEscuela?: string
      idPeriodo?: number
      idCarrera?: number
    }) => {
      setLoading(true)
      setError(null)
      try {
        const res = await generateLCFCPerceptionReport(params)
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
