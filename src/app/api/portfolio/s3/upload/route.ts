import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';

/**
 * POST /api/portfolio/s3/upload?key=EPE/2023/file.pdf
 * Body: multipart/form-data with a `file` field. One file per request; the
 * client uploads sequentially to keep memory and connection use predictable.
 */
export async function POST(request: NextRequest) {
	const key = request.nextUrl.searchParams.get('key');
	if (!key) {
		return NextResponse.json({ error: 'Missing key' }, { status: 400 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file');
		if (!(file instanceof File)) {
			return NextResponse.json({ error: 'Missing file' }, { status: 400 });
		}

		const bytes = new Uint8Array(await file.arrayBuffer());
		const client = getS3Client();
		await client.send(
			new PutObjectCommand({
				Bucket: BUCKET,
				Key: key,
				Body: bytes,
				ContentType: file.type || 'application/octet-stream',
			}),
		);

		return NextResponse.json({ ok: true, key });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'S3 upload error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
