import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';

/**
 * GET /api/portfolio/s3/download-folder?prefix=EPE/2023/
 * Streams every object under the prefix into a single ZIP. Credentials stay
 * server-side; the browser only receives the assembled archive.
 */
export async function GET(request: NextRequest) {
	const prefix = request.nextUrl.searchParams.get('prefix');
	if (!prefix) {
		return NextResponse.json({ error: 'Missing prefix' }, { status: 400 });
	}

	try {
		const client = getS3Client();

		// 1. List every key under the prefix (paginated, no delimiter = recursive).
		const keys: string[] = [];
		let continuationToken: string | undefined;
		do {
			const response = await client.send(
				new ListObjectsV2Command({
					Bucket: BUCKET,
					Prefix: prefix,
					ContinuationToken: continuationToken,
				}),
			);
			for (const obj of response.Contents ?? []) {
				if (obj.Key && !obj.Key.endsWith('/')) keys.push(obj.Key);
			}
			continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
		} while (continuationToken);

		if (keys.length === 0) {
			return NextResponse.json({ error: 'Empty folder' }, { status: 404 });
		}

		// 2. Fetch each object and add it to the zip with a path relative to the prefix.
		const zip = new JSZip();
		for (const key of keys) {
			const obj = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
			const bytes = await obj.Body?.transformToByteArray();
			if (bytes) zip.file(key.slice(prefix.length), bytes);
		}

		const content = await zip.generateAsync({ type: 'nodebuffer' });
		const folderName = prefix.replace(/\/$/, '').split('/').pop() || 'portfolio';

		return new NextResponse(new Uint8Array(content), {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': `attachment; filename="${folderName}.zip"`,
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'S3 zip error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
