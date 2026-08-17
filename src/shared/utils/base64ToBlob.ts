/**
 * Decodes a base64 payload into a Blob. Shared by every screen that receives a file from
 * the API as base64 instead of as a binary response — perception report PDFs, bulk-upload
 * error workbooks — so the decode lives in one place rather than once per call site.
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return new Blob([bytes], { type: mimeType });
}
