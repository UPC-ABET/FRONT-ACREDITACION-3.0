import Cookies from 'js-cookie';

const USER_KEY = 'token';
const SCHOOL_KEY = 'escuela';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
	sameSite: 'Strict',
	secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
	path: '/',
};

export function setAuthCookies(user: unknown, expiresIn: number): void {
	const expiresDays = expiresIn / 86400;
	const expiresAtMs = Date.now() + expiresIn * 1000;

	Cookies.set(USER_KEY, JSON.stringify(user), { ...COOKIE_OPTIONS, expires: expiresDays });
	Cookies.set(TOKEN_EXPIRY_KEY, String(expiresAtMs), { ...COOKIE_OPTIONS, expires: expiresDays });
}

export function getAuthCookie(key: 'token' | 'escuela'): string {
	if (typeof window === 'undefined') return '';
	return Cookies.get(key) ?? '';
}

export function getTokenExpiry(): number | null {
	if (typeof window === 'undefined') return null;
	const raw = Cookies.get(TOKEN_EXPIRY_KEY);
	if (!raw) return null;
	const ms = Number(raw);
	return Number.isFinite(ms) ? ms : null;
}

export function clearAuthCookies(): void {
	Cookies.remove(USER_KEY, { path: '/' });
	Cookies.remove(SCHOOL_KEY, { path: '/' });
	Cookies.remove(TOKEN_EXPIRY_KEY, { path: '/' });
}
