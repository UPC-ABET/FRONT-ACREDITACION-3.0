import { getSchoolCookie } from './auth-cookies';

export function getSchoolFromCookie(): Record<string, unknown> | null {
	return getSchoolCookie();
}
