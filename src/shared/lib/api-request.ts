export function getBearerToken(): string {
  return ''
}

export function buildJsonHeaders(headers: HeadersInit = {}, includeAuth = true): HeadersInit {
  const token = includeAuth ? getBearerToken() : ''

  return {
    'Content-Type': 'application/json',
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
