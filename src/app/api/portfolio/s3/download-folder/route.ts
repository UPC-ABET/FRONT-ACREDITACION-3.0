import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth, requirePortfolioScope } from '../_lib/requireAuth';

/** GET /api/portfolio/s3/download-folder?prefix=portfolio/EPE/2023/ — streams all objects under prefix as a ZIP. */
export async function GET(request: NextRequest) {
	const authError = requireAuth(request);
	if (authError) return authError;

	const prefix = request.nextUrl.searchParams.get('prefix');
	if (!prefix) {
		return NextResponse.json({ error: 'error.s3.prefixRequired' }, { status: 400 });
	}
	if (!requirePortfolioScope(prefix)) {
		return NextResponse.json({ error: 'error.s3.invalidKeyScope' }, { status: 400 });
	}

	try {
		const client = getS3Client();

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
			return NextResponse.json({ error: 'error.s3.emptyFolder' }, { status: 404 });
		}

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
	} catch {
		return NextResponse.json({ error: 'error.s3.downloadFolderFailed' }, { status: 500 });
	}
}
