/**
 * Decode JWT token payload
 * Returns the decoded payload object with all token data
 */
export function decodeToken(): Record<string, any> | null {
  if (typeof window === 'undefined') return null

  try {
    const token = localStorage.getItem('bearerToken')
    if (!token) return null

    // JWT format: header.payload.signature
    const parts = token.split('.')
    if (parts.length !== 3) return null

    // Decode payload (base64url to base64 to JSON)
    const payloadPart = parts[1]
    // Replace base64url characters with base64
    const base64 = payloadPart
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    // Add padding if needed
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(padded)
    const parsed = JSON.parse(decoded)

    return parsed
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
 * Get user_id from JWT token
 */
export function getUserIdFromToken(): string | number | null {
  const payload = decodeToken()
  return payload?.sub ?? payload?.user_id ?? null
}
