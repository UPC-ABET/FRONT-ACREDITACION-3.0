import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute, toRelative } from '../_lib/scope';

type S3Entry = {
	key: string;
	name: string;
	isFolder: boolean;
	size: number;
	lastModified: string | null;
};

export async function GET(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	const relativePrefix = request.nextUrl.searchParams.get('prefix') ?? '';
	const prefix = toAbsolute(relativePrefix);
	const client = getS3Client();

	const folders: S3Entry[] = [];
	const files: S3Entry[] = [];
	let continuationToken: string | undefined;

	try {
		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: BUCKET,
					Prefix: prefix,
					Delimiter: '/',
					ContinuationToken: continuationToken,
				}),
			);

			for (const cp of response.CommonPrefixes ?? []) {
				const key = cp.Prefix;
				if (!key) continue;
				const name = key.slice(prefix.length).replace(/\/$/, '');
				if (name) {
					folders.push({ key: toRelative(key), name, isFolder: true, size: 0, lastModified: null });
				}
			}

			for (const obj of response.Contents ?? []) {
				const key = obj.Key;
				if (!key || key === prefix || key.endsWith('/')) continue;
				files.push({
					key: toRelative(key),
					name: key.slice(prefix.length),
					isFolder: false,
					size: obj.Size ?? 0,
					lastModified: obj.LastModified?.toISOString() ?? null,
				});
			}

			continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
		} while (continuationToken);

		folders.sort((a, b) => a.name.localeCompare(b.name));
		files.sort((a, b) => a.name.localeCompare(b.name));

		return NextResponse.json({ prefix: relativePrefix, folders, files });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.listFailed', detail }, { status: 500 });
	}
}
