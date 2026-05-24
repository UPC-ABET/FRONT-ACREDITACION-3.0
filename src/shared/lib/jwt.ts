import { getAuthCookie } from './auth-cookies'

function getUserFromCookie(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = getAuthCookie('token')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

export function getSchoolIdFromToken(): number | null {
  const user = getUserFromCookie()
  if (!user) return null
  const id = (user as Record<string, unknown>).school_id
  return typeof id === 'number' ? id : null
}

export function getUserIdFromToken(): string | number | null {
  const user = getUserFromCookie()
  if (!user) return null

  if (user.sub != null) return user.sub as string | number
  if (user.user_id != null) return user.user_id as string | number
  if (user.userId != null) return user.userId as string | number
  if (user.id != null) return user.id as string | number

  return null
}
