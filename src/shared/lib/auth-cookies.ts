import Cookies from 'js-cookie';

const BEARER_TOKEN_KEY = 'bearerToken';
const USER_KEY = 'token';
const SCHOOL_KEY = 'escuela';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
	sameSite: 'Strict',
	secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
	path: '/',
};

function getJwtExpiry(raw: string): Date | undefined {
	try {
		const token = JSON.parse(raw) as string;
		const parts = (typeof token === 'string' ? token : raw).split('.');
		if (parts.length !== 3) return undefined;
		const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as {
			exp?: number;
		};
		return payload.exp ? new Date(payload.exp * 1000) : undefined;
	} catch {
		return undefined;
	}
}

export function setAuthCookies(bearerToken: string, user: unknown, escuela: string): void {
	const rawBearer = JSON.stringify(bearerToken);
	const expires = getJwtExpiry(rawBearer) ?? 1;

	Cookies.set(BEARER_TOKEN_KEY, rawBearer, { ...COOKIE_OPTIONS, expires });
	Cookies.set(USER_KEY, JSON.stringify(user), { ...COOKIE_OPTIONS, expires });
	Cookies.set(SCHOOL_KEY, JSON.stringify(escuela), { ...COOKIE_OPTIONS, expires });
}

export function getAuthCookie(key: 'bearerToken' | 'token' | 'escuela'): string {
	if (typeof window === 'undefined') return '';
	return Cookies.get(key) ?? '';
}

export function clearAuthCookies(): void {
	Cookies.remove(BEARER_TOKEN_KEY, { path: '/' });
	Cookies.remove(USER_KEY, { path: '/' });
	Cookies.remove(SCHOOL_KEY, { path: '/' });
}
