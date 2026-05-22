export function triggerBrowserDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
	} finally {
		setTimeout(() => URL.revokeObjectURL(url), 1_000);
	}
}
