import { DeleteObjectsCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth, requirePortfolioScope } from '../_lib/requireAuth';

const BATCH = 1000;

/** POST /api/portfolio/s3/delete — Body: { keys: string[] }. Keys ending in `/` are deleted recursively. */
export async function POST(request: NextRequest) {
	const authError = requireAuth(request);
	if (authError) return authError;

	try {
		const { keys } = (await request.json()) as { keys?: string[] };
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'error.s3.keysRequired' }, { status: 400 });
		}

		const invalidKey = keys.find((k) => !requirePortfolioScope(k));
		if (invalidKey) {
			return NextResponse.json({ error: 'error.s3.invalidKeyScope' }, { status: 400 });
		}

		const client = getS3Client();
		const toDelete = new Set<string>();

		for (const key of keys) {
			if (key.endsWith('/')) {
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
	} catch {
		return NextResponse.json({ error: 'error.s3.deleteFailed' }, { status: 500 });
	}
}
