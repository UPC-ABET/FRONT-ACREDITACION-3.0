export function cn(...classes: Array<string | undefined | null | false>) {
	return classes.filter(Boolean).join(' ');
}

const TRUSTED_HOSTS = new Set(
	[process.env.NEXT_PUBLIC_API_URL, typeof window !== 'undefined' ? window.location.origin : '']
		.filter(Boolean)
		.map((url) => {
			try {
				return new URL(url!).host;
			} catch {
				return '';
			}
		})
		.filter(Boolean),
);

function isTrustedUrl(url: string): boolean {
	if (url.startsWith('/') && !url.startsWith('//')) return true;
	try {
		return TRUSTED_HOSTS.has(new URL(url).host);
	} catch {
		return false;
	}
}

export function safeRedirect(url: string, mode: 'replace' | 'assign' = 'replace'): void {
	if (!isTrustedUrl(url)) {
		throw new Error(`Blocked redirect to untrusted URL: ${url}`);
	}
	if (mode === 'assign') {
		window.location.assign(url);
	} else {
		window.location.replace(url);
	}
}
