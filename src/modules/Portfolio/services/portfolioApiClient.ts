/**
 * PORTFOLIO API CLIENT
 *
 * Cliente fetch base para el modulo Portfolio.
 * Reemplaza el axios-based HttpContext del frontend antiguo.
 *
 * Diseno:
 *  - Sustento la sesion en localStorage('bearerToken') porque el authService
 *    actual del nuevo frontend ya guarda el token bajo esa misma key.
 *  - Para FormData no fuerzo Content-Type (el browser pone el boundary).
 *  - Soporto los dos envoltorios historicos del backend: { data } y { resource }
 *    via getApiData(...).
 */

import type { ApiEnvelope } from '../types'

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export const API_URL = RAW_API_URL.replace(/\/$/, '')

/**
 * Lee el bearer token desde localStorage('bearerToken').
 * El valor puede venir JSON-stringificado (compat. con el frontend antiguo)
 * o como string plano. Devuelve '' si no hay token o si esta corriendo en SSR.
 */
export function getToken(): string {
  if (typeof window === 'undefined') return ''
  const raw = window.localStorage.getItem('bearerToken')
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' ? parsed : raw
  } catch {
    return raw
  }
}

/**
 * Construye los headers HTTP. Si es FormData no fuerza Content-Type.
 */
export function buildHeaders(isFormData = false): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

/**
 * Helper que normaliza el "data" del envoltorio del backend.
 * Acepta tanto { data: ... } como { resource: ... } y como fallback la respuesta tal cual.
 */
export function getApiData<T = unknown>(response: unknown): T {
  if (response && typeof response === 'object') {
    const env = response as ApiEnvelope<T>
    if (env.data !== undefined) return env.data as T
    if (env.resource !== undefined) return env.resource as T
  }
  return response as T
}

function joinUrl(path: string): string {
  if (!path) return API_URL
  if (/^https?:\/\//i.test(path)) return path
  return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

async function parseBody<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  // Algunos endpoints devuelven texto plano o vacio.
  const text = await res.text()
  if (!text) return undefined as unknown as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as unknown as T
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  isFormData = false
): Promise<T> {
  const url = joinUrl(path)
  const res = await fetch(url, {
    ...init,
    headers: {
      ...buildHeaders(isFormData),
      ...(init.headers ?? {}),
    },
  })

  if (!res.ok) {
    const errorBody = await parseBody<unknown>(res).catch(() => null)
    const message =
      (errorBody as { message?: string } | null)?.message ??
      `${res.status} ${res.statusText}`
    const err = new Error(`[Portfolio API] ${message}`) as Error & {
      status?: number
      body?: unknown
    }
    err.status = res.status
    err.body = errorBody
    throw err
  }

  return parseBody<T>(res)
}

export function apiGet<T = unknown>(path: string, init?: RequestInit) {
  return request<T>(path, { method: 'GET', ...init })
}

export function apiPost<T = unknown>(
  path: string,
  body?: unknown,
  init?: RequestInit
) {
  return request<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  })
}

export function apiPut<T = unknown>(
  path: string,
  body?: unknown,
  init?: RequestInit
) {
  return request<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  })
}

export function apiDelete<T = unknown>(
  path: string,
  body?: unknown,
  init?: RequestInit
) {
  return request<T>(path, {
    method: 'DELETE',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...init,
  })
}

export function apiUploadFormData<T = unknown>(
  path: string,
  formData: FormData,
  init?: RequestInit
) {
  return request<T>(
    path,
    {
      method: 'POST',
      body: formData,
      ...init,
    },
    true
  )
}
