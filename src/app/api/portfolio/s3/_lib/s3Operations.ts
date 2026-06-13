import {
	CopyObjectCommand,
	DeleteObjectsCommand,
	ListObjectsV2Command,
	type S3Client,
} from '@aws-sdk/client-s3';
import { BUCKET } from './s3Client';

export const INVALID_NAME_CHARS = /[\\/:*?"<>|]/;
export const MAX_NAME_LENGTH = 255;
const BATCH = 1000;

export function isFolderKey(key: string): boolean {
	return key.endsWith('/');
}

export function parentPrefix(key: string): string {
	const trimmed = isFolderKey(key) ? key.slice(0, -1) : key;
	const slash = trimmed.lastIndexOf('/');
	return slash === -1 ? '' : trimmed.slice(0, slash + 1);
}

export function lastSegment(key: string): string {
	const trimmed = isFolderKey(key) ? key.slice(0, -1) : key;
	const slash = trimmed.lastIndexOf('/');
	return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}

export async function listAllKeys(client: S3Client, prefix: string): Promise<string[]> {
	const keys: string[] = [];
	let continuationToken: string | undefined;
	do {
		const response = await client.send(
			new ListObjectsV2Command({
				Bucket: BUCKET,
				Prefix: prefix || undefined,
				ContinuationToken: continuationToken,
			}),
		);
		for (const obj of response.Contents ?? []) {
			if (obj.Key) keys.push(obj.Key);
		}
		continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
	} while (continuationToken);
	return keys;
}

export async function totalSize(client: S3Client, keys: string[]): Promise<number> {
	let total = 0;
	for (const key of keys) {
		if (isFolderKey(key)) {
			let continuationToken: string | undefined;
			do {
				const response = await client.send(
					new ListObjectsV2Command({
						Bucket: BUCKET,
						Prefix: key,
						ContinuationToken: continuationToken,
					}),
				);
				for (const obj of response.Contents ?? []) total += obj.Size ?? 0;
				continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
			} while (continuationToken);
		} else {
			const response = await client.send(
				new ListObjectsV2Command({ Bucket: BUCKET, Prefix: key, MaxKeys: 1 }),
			);
			const match = response.Contents?.find((o) => o.Key === key);
			total += match?.Size ?? 0;
		}
	}
	return total;
}

export async function keyExists(client: S3Client, key: string): Promise<boolean> {
	const response = await client.send(
		new ListObjectsV2Command({ Bucket: BUCKET, Prefix: key, MaxKeys: 1 }),
	);
	return (response.Contents ?? []).some((o) => o.Key === key);
}

export async function resolveUniqueName(
	client: S3Client,
	destPrefix: string,
	name: string,
	isFolder: boolean,
): Promise<string> {
	const dot = isFolder ? -1 : name.lastIndexOf('.');
	const base = dot > 0 ? name.slice(0, dot) : name;
	const ext = dot > 0 ? name.slice(dot) : '';

	let candidate = name;
	let counter = 1;
	// Append ` (n)` before the extension until the destination has no collision.
	while (
		await keyExists(client, isFolder ? `${destPrefix}${candidate}/` : `${destPrefix}${candidate}`)
	) {
		candidate = `${base} (${counter})${ext}`;
		counter += 1;
	}
	return candidate;
}

export async function copyObject(client: S3Client, source: string, dest: string): Promise<void> {
	// CopySource must keep `/` as path separators but URL-encode each segment;
	// encoding the whole key would turn the separators into %2F and break nested
	// keys (and any key containing spaces or special characters).
	const encodedSource = source.split('/').map(encodeURIComponent).join('/');
	await client.send(
		new CopyObjectCommand({
			Bucket: BUCKET,
			CopySource: `/${BUCKET}/${encodedSource}`,
			Key: dest,
		}),
	);
}

export async function copyPrefix(
	client: S3Client,
	sourcePrefix: string,
	destPrefix: string,
): Promise<void> {
	const keys = await listAllKeys(client, sourcePrefix);
	for (const key of keys) {
		const dest = `${destPrefix}${key.slice(sourcePrefix.length)}`;
		await copyObject(client, key, dest);
	}
}

export async function deleteKeys(client: S3Client, keys: string[]): Promise<void> {
	for (let i = 0; i < keys.length; i += BATCH) {
		const chunk = keys.slice(i, i + BATCH);
		await client.send(
			new DeleteObjectsCommand({
				Bucket: BUCKET,
				Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
			}),
		);
	}
}

export async function deletePrefix(client: S3Client, prefix: string): Promise<void> {
	const keys = await listAllKeys(client, prefix);
	await deleteKeys(client, keys.length > 0 ? keys : [prefix]);
}

export function validateName(name: string): string | null {
	const clean = name.trim();
	if (!clean) return 'error.s3.invalidName';
	if (INVALID_NAME_CHARS.test(clean)) return 'error.s3.invalidNameChars';
	if (clean.length > MAX_NAME_LENGTH) return 'error.s3.nameTooLong';
	return null;
}
