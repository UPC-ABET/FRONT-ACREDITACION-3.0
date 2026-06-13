import { GetObjectCommand } from '@aws-sdk/client-s3';
import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute } from '../_lib/scope';
import { listAllKeys } from '../_lib/s3Operations';

export async function GET(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	const relativePrefix = request.nextUrl.searchParams.get('prefix');
	if (!relativePrefix) {
		return NextResponse.json({ error: 'error.s3.prefixRequired' }, { status: 400 });
	}

	try {
		const prefix = toAbsolute(relativePrefix);
		const client = getS3Client();
		const keys = (await listAllKeys(client, prefix)).filter((key) => !key.endsWith('/'));

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
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.downloadFolderFailed', detail }, { status: 500 });
	}
}
