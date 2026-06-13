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

	/** Renames a single file or folder (extension preserved for files). */
	async rename(key: string, newName: string): Promise<void> {
		const res = await fetch(`${BASE}/rename`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ key, newName }),
		});
		if (!res.ok) return readError(res, 'Failed to rename');
	},

	/** Copies files/folders into the destination prefix (auto-renames on collision). */
	async copy(keys: string[], destPrefix: string): Promise<void> {
		const res = await fetch(`${BASE}/copy`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys, destPrefix }),
		});
		if (!res.ok) return readError(res, 'Failed to copy');
	},

	/** Moves files/folders into the destination prefix. */
	async move(keys: string[], destPrefix: string): Promise<void> {
		const res = await fetch(`${BASE}/move`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys, destPrefix }),
		});
		if (!res.ok) return readError(res, 'Failed to move');
	},

	/** Creates a plain-text comment file under the given prefix. */
	async createTextFile(prefix: string, name: string): Promise<void> {
		const res = await fetch(`${BASE}/text-file`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prefix, name }),
		});
		if (!res.ok) return readError(res, 'Failed to create comment');
	},

	/** Lists every object key under a prefix (used by the tree view). */
	async listAllKeys(prefix = ''): Promise<string[]> {
		const res = await fetch(`${BASE}/all-keys?prefix=${encodeURIComponent(prefix)}`);
		if (!res.ok) return readError(res, 'Failed to load tree');
		return (await res.json()).keys as string[];
	},

	/** Returns the combined byte size of the given files/folders. */
	async totalSize(keys: string[]): Promise<number> {
		const res = await fetch(`${BASE}/size`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys }),
		});
		if (!res.ok) return readError(res, 'Failed to compute size');
		return (await res.json()).totalBytes as number;
	},
};
