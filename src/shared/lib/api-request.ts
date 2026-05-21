export function getBearerToken(): string {
  if (typeof window === 'undefined') return ''

  try {
    const raw = localStorage.getItem('bearerToken')
    if (!raw) return ''

    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string' && parsed.trim()) {
        return parsed.replace(/"/g, '')
      }
    } catch {
      // ignore JSON parse errors and fall back to raw value
    }

    return raw.replace(/"/g, '').trim()
  } catch {
    return ''
  }
}

export function buildJsonHeaders(headers: HeadersInit = {}, includeAuth = true): HeadersInit {
  const token = includeAuth ? getBearerToken() : ''

  return {
    'Content-Type': 'application/json',
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
