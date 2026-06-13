/**
 * Every S3 operation is confined to this namespace. The browser works with keys
 * relative to it (e.g. `EPE/2023/`); the server prepends `ROOT_PREFIX` before
 * touching S3 and strips it from anything it returns, so a caller can never
 * reach objects outside `portfolio/` no matter what key it sends.
 */
export const ROOT_PREFIX = 'portfolio/';

export function toAbsolute(relative: string | null | undefined): string {
	return `${ROOT_PREFIX}${(relative ?? '').replace(/^\/+/, '')}`;
}

export function toRelative(absolute: string): string {
	return absolute.startsWith(ROOT_PREFIX) ? absolute.slice(ROOT_PREFIX.length) : absolute;
}
