import type { S3ListResponse } from '../types';

const BASE = '/api/portfolio/s3';

async function readError(res: Response, fallback: string): Promise<never> {
	let message = fallback;
	try {
		const data = await res.json();
		if (data?.error) message = data.error;
	} catch {
		/* ignore non-JSON bodies */
	}
	throw new Error(message);
}

function triggerBlobDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export const portfolioS3Service = {
	async list(prefix = ''): Promise<S3ListResponse> {
		const res = await fetch(`${BASE}/list?prefix=${encodeURIComponent(prefix)}`);
		if (!res.ok) return readError(res, 'Failed to list files');
		return res.json();
	},

	async getDownloadUrl(key: string): Promise<string> {
		const res = await fetch(`${BASE}/download-url?key=${encodeURIComponent(key)}`);
		if (!res.ok) return readError(res, 'Failed to get download URL');
		return (await res.json()).url as string;
	},

	/** Downloads a single file (fetches via presigned URL to force the filename). */
	async downloadFile(key: string, name: string): Promise<void> {
		const url = await this.getDownloadUrl(key);
		const res = await fetch(url);
		if (!res.ok) throw new Error('Failed to download file');
		triggerBlobDownload(await res.blob(), name);
	},

	/** Downloads a whole folder as a ZIP assembled server-side. */
	async downloadFolder(prefix: string, name: string): Promise<void> {
		const res = await fetch(`${BASE}/download-folder?prefix=${encodeURIComponent(prefix)}`);
		if (!res.ok) return readError(res, 'Failed to download folder');
		triggerBlobDownload(await res.blob(), `${name}.zip`);
	},

	async uploadFile(key: string, file: File): Promise<void> {
		const formData = new FormData();
		formData.append('file', file);
		const res = await fetch(`${BASE}/upload?key=${encodeURIComponent(key)}`, {
			method: 'POST',
			body: formData,
		});
		if (!res.ok) return readError(res, 'Failed to upload file');
	},

	async createFolder(prefix: string, name: string): Promise<void> {
		const res = await fetch(`${BASE}/folder`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prefix, name }),
		});
		if (!res.ok) return readError(res, 'Failed to create folder');
	},

	async deleteEntries(keys: string[]): Promise<void> {
		const res = await fetch(`${BASE}/delete`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys }),
		});
		if (!res.ok) return readError(res, 'Failed to delete');
	},
};
