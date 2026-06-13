import type { S3ListResponse } from '../types';

const BASE = '/api/portfolio/s3';

async function readError(res: Response, fallbackKey: string): Promise<never> {
	let message = fallbackKey;
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
		if (!res.ok) return readError(res, 'error.s3.listFailed');
		return res.json();
	},

	async getDownloadUrl(key: string): Promise<string> {
		const res = await fetch(`${BASE}/download-url?key=${encodeURIComponent(key)}`);
		if (!res.ok) return readError(res, 'error.s3.downloadUrlFailed');
		return (await res.json()).url as string;
	},

	async downloadFile(key: string, name: string): Promise<void> {
		const url = await this.getDownloadUrl(key);
		const res = await fetch(url);
		if (!res.ok) throw new Error('error.s3.downloadFailed');
		triggerBlobDownload(await res.blob(), name);
	},

	async downloadFolder(prefix: string, name: string): Promise<void> {
		const res = await fetch(`${BASE}/download-folder?prefix=${encodeURIComponent(prefix)}`);
		if (!res.ok) return readError(res, 'error.s3.downloadFolderFailed');
		triggerBlobDownload(await res.blob(), `${name}.zip`);
	},

	async downloadSelection(keys: string[], zipName: string): Promise<void> {
		const res = await fetch(`${BASE}/download-selection`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys }),
		});
		if (!res.ok) return readError(res, 'error.s3.downloadFolderFailed');
		triggerBlobDownload(await res.blob(), `${zipName}.zip`);
	},

	async uploadFile(key: string, file: File): Promise<void> {
		const formData = new FormData();
		formData.append('file', file);
		const res = await fetch(`${BASE}/upload?key=${encodeURIComponent(key)}`, {
			method: 'POST',
			body: formData,
		});
		if (!res.ok) return readError(res, 'error.s3.uploadFailed');
	},

	async createFolder(prefix: string, name: string): Promise<void> {
		const res = await fetch(`${BASE}/folder`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prefix, name }),
		});
		if (!res.ok) return readError(res, 'error.s3.createFolderFailed');
	},

	async deleteEntries(keys: string[]): Promise<void> {
		const res = await fetch(`${BASE}/delete`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys }),
		});
		if (!res.ok) return readError(res, 'error.s3.deleteFailed');
	},

	async rename(key: string, newName: string): Promise<void> {
		const res = await fetch(`${BASE}/rename`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ key, newName }),
		});
		if (!res.ok) return readError(res, 'error.s3.renameFailed');
	},

	async copy(keys: string[], destPrefix: string): Promise<void> {
		const res = await fetch(`${BASE}/copy`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys, destPrefix }),
		});
		if (!res.ok) return readError(res, 'error.s3.copyFailed');
	},

	async move(keys: string[], destPrefix: string): Promise<void> {
		const res = await fetch(`${BASE}/move`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys, destPrefix }),
		});
		if (!res.ok) return readError(res, 'error.s3.moveFailed');
	},

	async createTextFile(prefix: string, name: string): Promise<void> {
		const res = await fetch(`${BASE}/text-file`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prefix, name }),
		});
		if (!res.ok) return readError(res, 'error.s3.createCommentFailed');
	},

	async listAllKeys(prefix = ''): Promise<string[]> {
		const res = await fetch(`${BASE}/all-keys?prefix=${encodeURIComponent(prefix)}`);
		if (!res.ok) return readError(res, 'error.s3.treeFailed');
		return (await res.json()).keys as string[];
	},

	async totalSize(keys: string[]): Promise<number> {
		const res = await fetch(`${BASE}/size`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ keys }),
		});
		if (!res.ok) return readError(res, 'error.s3.sizeFailed');
		return (await res.json()).totalBytes as number;
	},
};
