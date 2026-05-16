'use client'

import { useState, useCallback } from 'react'
import type {
  CompetenceConfig,
  CompetenceFormData,
  GRAStudent,
  StudentSearchResult,
  EmailTemplate,
  SendEmailRequest,
} from '../types'
import {
  listGRACompetences,
  saveGRACompetence,
  deleteGRACompetence,
  cloneGRAConfiguration,
  searchStudentByCode,
  addStudentToNotification,
  deleteStudentNotification,
  listGRAStudents,
  getGRAEmailTemplate,
  saveGRAEmailTemplate,
  sendGRAEmail,
  downloadGRATemplate,
  uploadGRAMassive,
  generateGRAPerceptionReport,
  getCycleList,
} from '../services'

export function useGRACycles() {
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

export function useGRACompetences() {
  const [competences, setCompetences] = useState<CompetenceConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (idPeriodo: number, idCarrera = 0) => {
    setLoading(true)
    setError(null)
    try {
      setCompetences(await listGRACompetences(idPeriodo, idCarrera))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(async (data: CompetenceFormData, onSuccess?: () => void) => {
    try {
      await saveGRACompetence(data)
      onSuccess?.()
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  const remove = useCallback(async (id: number, onSuccess?: () => void) => {
    try {
      await deleteGRACompetence(id)
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
        await cloneGRAConfiguration(params)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  return { competences, loading, error, load, save, remove, clone, setError }
}

export function useGRAStudents(idEncuesta: number) {
  const [students, setStudents] = useState<GRAStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { students: data } = await listGRAStudents(idEncuesta)
      setStudents(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [idEncuesta])

  const remove = useCallback(
    async (idNotificacion: number, onSuccess?: () => void) => {
      try {
        await deleteStudentNotification(idNotificacion)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  return { students, loading, error, load, remove }
}

export function useGRAStudentSearch() {
  const [result, setResult] = useState<StudentSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (codigo: string, idCarrera: number) => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const student = await searchStudentByCode(codigo, idCarrera)
      setResult(student)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const add = useCallback(
    async (
      params: {
        idEstudiante: number
        idEncuesta: number
        emailEstudiante: string
        nombreEstudiante: string
      },
      onSuccess?: () => void
    ) => {
      try {
        await addStudentToNotification(params)
        setResult(null)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      }
    },
    []
  )

  return { result, loading, error, search, add, reset: () => setResult(null) }
}

export function useGRAEmail(idEncuesta: number) {
  const [template, setTemplate] = useState<EmailTemplate>({ asunto: '', cuerpo: '' })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const t = await getGRAEmailTemplate(idEncuesta)
      setTemplate(t)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [idEncuesta])

  const save = useCallback(
    async (tmpl: EmailTemplate, onSuccess?: () => void) => {
      setSaving(true)
      try {
        await saveGRAEmailTemplate({ ...tmpl, idEncuesta })
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setSaving(false)
      }
    },
    [idEncuesta]
  )

  const send = useCallback(
    async (req: SendEmailRequest, onSuccess?: () => void) => {
      setSending(true)
      try {
        await sendGRAEmail(req)
        onSuccess?.()
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setSending(false)
      }
    },
    []
  )

  return { template, setTemplate, loading, saving, sending, error, load, save, send }
}

export function useGRAUpload() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const downloadTemplate = useCallback(async (idPeriodo: number) => {
    setError(null)
    try {
      await downloadGRATemplate(idPeriodo)
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
      await uploadGRAMassive(file, escuelaActual ?? undefined)
      setSuccess(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, success, downloadTemplate, upload, reset: () => setSuccess(false) }
}

export function useGRAReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<{
    pdfFiles?: Array<{ fileName: string; base64Content: string }>
    zipFile?: { base64Content: string; fileName: string }
  } | null>(null)

  const generate = useCallback(
    async (params: { idPeriodoAcademico?: number; idCarrera?: number; idComision?: number }) => {
      setLoading(true)
      setError(null)
      try {
        const res = await generateGRAPerceptionReport(params)
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
