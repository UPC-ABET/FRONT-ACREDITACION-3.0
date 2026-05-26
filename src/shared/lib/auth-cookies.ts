import Cookies from 'js-cookie';

const SCHOOL_KEY = 'school';

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
	sameSite: 'Lax',
	secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
	path: '/',
};

export function setSchoolCookie(school: Record<string, unknown>): void {
	Cookies.set(SCHOOL_KEY, JSON.stringify(school), { ...COOKIE_OPTIONS, expires: 365 });
}

export function getSchoolCookie(): Record<string, unknown> | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = Cookies.get(SCHOOL_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return typeof parsed === 'object' && parsed !== null ? parsed : null;
	} catch {
		return null;
	}
}

export function clearPreferenceCookies(): void {
	Cookies.remove(SCHOOL_KEY, { path: '/' });
}
