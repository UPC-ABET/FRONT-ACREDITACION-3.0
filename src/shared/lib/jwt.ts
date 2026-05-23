/**
 * Decode JWT token payload.
 * Handles tokens stored raw or JSON-stringified in localStorage.
 * Returns the decoded payload object with all token data.
 */
export function decodeToken(): Record<string, any> | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem('bearerToken')
    if (!raw) return null

    // The token may be stored as JSON.stringify(token) → strip surrounding quotes
    let token = raw
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string') token = parsed
    } catch {
      // raw value is already a plain JWT string
    }

    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Decode payload (base64url → base64 → JSON)
    const payloadPart = parts[1]
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(padded)

    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Get school_id from JWT token
 */
export function getSchoolIdFromToken(): number | null {
  const payload = decodeToken()
  return payload?.school_id ?? null
}

/**
 * Get user_id from JWT token.
 * Checks the most common claim names used by NestJS/standard JWTs.
 */
export function getUserIdFromToken(): string | number | null {
  const payload = decodeToken()
  if (!payload) return null

  // Standard JWT claim
  if (payload.sub != null) return payload.sub

  // Common NestJS / snake_case variants
  if (payload.user_id != null) return payload.user_id
  if (payload.userId != null) return payload.userId
  if (payload.id != null) return payload.id

  return null
}
