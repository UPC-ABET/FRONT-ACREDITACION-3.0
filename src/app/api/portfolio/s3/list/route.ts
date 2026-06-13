import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth, requirePortfolioScope } from '../_lib/requireAuth';

type S3Entry = {
	key: string;
	name: string;
	isFolder: boolean;
	size: number;
	lastModified: string | null;
};

/** GET /api/portfolio/s3/list?prefix=portfolio/EPE/2023/ — lists one folder level. */
export async function GET(request: NextRequest) {
	const authError = requireAuth(request);
	if (authError) return authError;

	const prefix = request.nextUrl.searchParams.get('prefix') ?? 'portfolio/';

	if (!requirePortfolioScope(prefix)) {
		return NextResponse.json({ error: 'error.s3.invalidKeyScope' }, { status: 400 });
	}

	const client = getS3Client();

	const folders: S3Entry[] = [];
	const files: S3Entry[] = [];
	let continuationToken: string | undefined;

	try {
		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: BUCKET,
					Prefix: prefix || undefined,
					Delimiter: '/',
					ContinuationToken: continuationToken,
				}),
			);

			for (const cp of response.CommonPrefixes ?? []) {
				const key = cp.Prefix;
				if (!key) continue;
				const name = key.slice(prefix.length).replace(/\/$/, '');
				if (name) folders.push({ key, name, isFolder: true, size: 0, lastModified: null });
			}

			for (const obj of response.Contents ?? []) {
				const key = obj.Key;
				if (!key || key === prefix || key.endsWith('/')) continue;
				const name = key.slice(prefix.length);
				files.push({
					key,
					name,
					isFolder: false,
					size: obj.Size ?? 0,
					lastModified: obj.LastModified?.toISOString() ?? null,
				});
			}

			continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
		} while (continuationToken);

		folders.sort((a, b) => a.name.localeCompare(b.name));
		files.sort((a, b) => a.name.localeCompare(b.name));

		return NextResponse.json({ prefix, folders, files });
	} catch {
		return NextResponse.json({ error: 'error.s3.listFailed' }, { status: 500 });
	}
}
