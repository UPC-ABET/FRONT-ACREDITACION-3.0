export function triggerFileDownload(base64: string, contentType: string, fileName: string): void {
	const byteCharacters = atob(base64);
	const byteArray = new Uint8Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i += 1) {
		byteArray[i] = byteCharacters.charCodeAt(i);
	}
	const blob = new Blob([byteArray], { type: contentType });
	triggerBlobDownload(blob, fileName);
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	a.click();
	URL.revokeObjectURL(url);
}

export function resolveDownloadFileName(response: Response, fallback: string): string {
	const disposition = response.headers.get('content-disposition') ?? '';
	const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
	return match ? decodeURIComponent(match[1]) : fallback;
}

export async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			const base64 = result.split(',')[1] ?? '';
			resolve(base64);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
