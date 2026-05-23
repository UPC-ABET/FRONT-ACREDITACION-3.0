'use client'

import { useState, useCallback } from 'react'
import type {
  SurveyTokenVerification,
  SurveyOutcomesResponse,
  SurveySubmitRequest,
  SurveyCommissionGroup,
} from '../types'
import {
  verifyLCFCSurveyToken,
  getLCFCSurveyOutcomes,
  submitLCFCSurvey,
  verifyGRASurveyToken,
  getGRASurveyByToken,
  submitGRASurvey,
} from '../services'

export function useSurvey() {
  const [verification, setVerification] = useState<SurveyTokenVerification | null>(null)
  const [surveyData, setSurveyData] = useState<SurveyOutcomesResponse | null>(null)
  const [outcomes, setOutcomes] = useState<SurveyCommissionGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (escuela: string, token: string) => {
    setLoading(true)
    setError(null)
    try {
      const v = await verifyLCFCSurveyToken(escuela, token)
      setVerification(v)

      if (v.estado === true) {
        setAlreadyAnswered(true)
        return
      }

      const data = await getLCFCSurveyOutcomes(escuela, v.alumnoId, v.encuestaId, v.token)
      setSurveyData(data)
      setOutcomes(data.lista)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateScore = useCallback(
    (comisionId: number, outcomeId: number, puntaje: number) => {
      setOutcomes((prev) =>
        prev.map((group) =>
          group.comisionId === comisionId
            ? {
                ...group,
                outcomes: group.outcomes.map((o) =>
                  o.outcomeId === outcomeId ? { ...o, desempeno: puntaje } : o
                ),
              }
            : group
        )
      )
    },
    []
  )

  const submit = useCallback(
    async (comentario: string, onSuccess?: () => void) => {
      if (!verification || !surveyData) return

      const allAnswered = outcomes.every((g) => g.outcomes.every((o) => o.desempeno !== null))
      if (!allAnswered || !comentario.trim()) {
        setError('Debes completar todos los campos de la encuesta antes de enviar.')
        return
      }

      setSubmitting(true)
      setError(null)

      const lista = outcomes.flatMap((g) =>
        g.outcomes.map((o) => ({
          comisionId: o.comisionId,
          outcomeId: o.outcomeId,
          puntaje: o.desempeno as number,
          descripcion: '',
        }))
      )

      const request: SurveySubmitRequest = {
        token: verification.token,
        comentario,
        encuestaId: verification.encuestaId,
        escuela: verification.escuela,
        lista,
      }

      try {
        const res = await submitLCFCSurvey(request)
        if (res.success) {
          setSubmitted(true)
          onSuccess?.()
        } else {
          setError('No se pudo enviar la encuesta. Inténtalo nuevamente.')
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setSubmitting(false)
      }
    },
    [verification, surveyData, outcomes]
  )

  return {
    verification,
    surveyData,
    outcomes,
    loading,
    submitting,
    submitted,
    alreadyAnswered,
    error,
    verify,
    updateScore,
    submit,
    setError,
  }
}

export function useGRASurvey() {
  const [verification, setVerification] = useState<SurveyTokenVerification | null>(null)
  const [surveyData, setSurveyData] = useState<SurveyOutcomesResponse | null>(null)
  const [outcomes, setOutcomes] = useState<SurveyCommissionGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = useCallback(async (token: string) => {
    setLoading(true)
    setError(null)
    try {
      const v = await verifyGRASurveyToken(token)
      setVerification(v)

      if (v.estado === true) {
        setAlreadyAnswered(true)
        return
      }

      const data = await getGRASurveyByToken(token)
      setSurveyData(data)
      setOutcomes(data.lista)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateScore = useCallback(
    (comisionId: number, outcomeId: number, puntaje: number) => {
      setOutcomes((prev) =>
        prev.map((group) =>
          group.comisionId === comisionId
            ? {
                ...group,
                outcomes: group.outcomes.map((o) =>
                  o.outcomeId === outcomeId ? { ...o, desempeno: puntaje } : o
                ),
              }
            : group
        )
      )
    },
    []
  )

  const submit = useCallback(
    async (comentario: string, onSuccess?: () => void) => {
      if (!verification || !surveyData) return

      const allAnswered = outcomes.every((g) => g.outcomes.every((o) => o.desempeno !== null))
      if (!allAnswered || !comentario.trim()) {
        setError('Debes completar todos los campos de la encuesta antes de enviar.')
        return
      }

      setSubmitting(true)
      setError(null)

      const scores = outcomes.flatMap((g) =>
        g.outcomes.map((o) => ({
          outcomeConfigId: o.outcomeId,
          score: o.desempeno as number,
        }))
      )

      try {
        const res = await submitGRASurvey(verification.token ?? '', comentario, scores)
        if (res.success) {
          setSubmitted(true)
          onSuccess?.()
        } else {
          setError('No se pudo enviar la encuesta. Inténtalo nuevamente.')
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setSubmitting(false)
      }
    },
    [verification, surveyData, outcomes]
  )

  return {
    verification,
    surveyData,
    outcomes,
    loading,
    submitting,
    submitted,
    alreadyAnswered,
    error,
    verify,
    updateScore,
    submit,
    setError,
  }
}
