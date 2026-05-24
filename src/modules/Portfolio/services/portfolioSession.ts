/**
 * PORTFOLIO SESSION HELPER
 *
 * Lee la sesion del usuario para el modulo Portfolio.
 * Mantiene compatibilidad con las keys de localStorage usadas en el
 * frontend antiguo (UPC-SA-2025-FRONTEND):
 *   - bearerToken (JSON-stringified)
 *   - escuela     (JSON-stringified)
 *   - token       (objeto user con usuarioIamId, portfolioConfiguration, ...)
 *   - codigo, idUsuario
 *
 * El frontend nuevo (authService) tambien escribe en localStorage('bearerToken')
 * y localStorage('token'), por lo que reutilizamos esa convencion.
 *
 * Todas las funciones son SSR-safe: devuelven null/cadena vacia si no hay
 * window disponible.
 */

import type { PortfolioConfiguration, PortfolioUser } from '../types'

const isBrowser = () => typeof window !== 'undefined'

function readJSON<T>(key: string): T | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return raw as unknown as T
  }
}

function readString(key: string): string {
  if (!isBrowser()) return ''
  return window.localStorage.getItem(key) ?? ''
}

export function getToken(): string {
  const raw = readJSON<unknown>('bearerToken')
  if (raw === null) return ''
  return typeof raw === 'string' ? raw : String(raw)
}

export function getUser(): PortfolioUser | null {
  // Compatibilidad: el antiguo guarda el usuario completo en 'token'.
  const user = readJSON<PortfolioUser>('token')
  return user
}

export function getSchool(): string {
  // El antiguo lo guarda como JSON-stringified ("IAM").
  const value = readJSON<unknown>('escuela')
  if (value === null) return ''
  return typeof value === 'string' ? value : String(value)
}

export function getUserId(): string | number | null {
  const user = getUser()
  if (user?.usuarioIamId !== undefined) return user.usuarioIamId
  const raw = readString('idUsuario')
  return raw || null
}

export function getUserCode(): string {
  const user = getUser()
  if (user?.codigo) return user.codigo
  return readString('codigo')
}

export function getPortfolioConfiguration(): PortfolioConfiguration | null {
  const user = getUser()
  if (!user?.portfolioConfiguration) return null
  if (typeof user.portfolioConfiguration === 'string') {
    try {
      return JSON.parse(user.portfolioConfiguration) as PortfolioConfiguration
    } catch {
      return null
    }
  }
  return user.portfolioConfiguration
}

export function getAllowedRoutes(): string[] {
  const config = getPortfolioConfiguration()
  if (!config) return []
  const rutas = config.RUTAS
  if (!rutas) return []
  if (Array.isArray(rutas)) return rutas
  if (typeof rutas === 'string') return [rutas]
  return []
}

/**
 * Devuelve toda la sesion en un solo objeto. SSR-safe (devuelve null en server).
 */
export function getPortfolioSession() {
  if (!isBrowser()) return null
  return {
    token: getToken(),
    user: getUser(),
    school: getSchool(),
    userId: getUserId(),
    userCode: getUserCode(),
    allowedRoutes: getAllowedRoutes(),
    portfolioConfiguration: getPortfolioConfiguration(),
  }
}
