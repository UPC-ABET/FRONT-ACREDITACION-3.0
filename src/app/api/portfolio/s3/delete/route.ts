import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';

const BATCH = 1000;

/**
 * POST /api/portfolio/s3/delete
 * Body: { keys: string[] }
 * Keys ending in `/` are treated as folders and deleted recursively.
 */
export async function POST(request: NextRequest) {
	try {
		const { keys } = (await request.json()) as { keys?: string[] };
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'No keys provided' }, { status: 400 });
		}

		const client = getS3Client();
		const toDelete = new Set<string>();

		for (const key of keys) {
			if (key.endsWith('/')) {
				// Folder: collect every object underneath it (plus the placeholder).
				let continuationToken: string | undefined;
				do {
					const response = await client.send(
						new ListObjectsV2Command({
							Bucket: BUCKET,
							Prefix: key,
							ContinuationToken: continuationToken,
						}),
					);
					for (const obj of response.Contents ?? []) {
						if (obj.Key) toDelete.add(obj.Key);
					}
					continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
				} while (continuationToken);
				toDelete.add(key);
			} else {
				toDelete.add(key);
			}
		}

		const allKeys = [...toDelete];
		for (let i = 0; i < allKeys.length; i += BATCH) {
			const chunk = allKeys.slice(i, i + BATCH);
			await client.send(
				new DeleteObjectsCommand({
					Bucket: BUCKET,
					Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
				}),
			);
		}

		return NextResponse.json({ ok: true, deleted: allKeys.length });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'S3 delete error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
