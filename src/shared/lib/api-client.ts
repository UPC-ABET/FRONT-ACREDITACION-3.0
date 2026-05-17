/**
 * Shared API helpers.
 *
 * Centralised here once we needed the same bearer-token header in three
 * different module services.
 */

export function authHeader(): Record<string, string> {
	if (typeof window === 'undefined') return {};
	const raw = window.localStorage.getItem('bearerToken');
	if (!raw) return {};
	try {
		const token = JSON.parse(raw) as string;
		return token ? { Authorization: `Bearer ${token}` } : {};
	} catch {
		return {};
	}
}
