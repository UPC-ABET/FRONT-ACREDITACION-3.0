export function parseFilename(header: string | null, fallback: string): string {
	if (!header) return fallback;
	const rfc5987 = header.match(/filename\*=UTF-8''([^;]+)/i);
	if (rfc5987) {
		try {
			return decodeURIComponent(rfc5987[1]);
		} catch {
			// Undecodable RFC 5987 value: fall back to the plain filename.
		}
	}
	const plain = header.match(/filename="([^"]+)"/);
	if (plain) return plain[1];
	return fallback;
}
