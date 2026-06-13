import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute } from '../_lib/scope';

export async function POST(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	const relativeKey = request.nextUrl.searchParams.get('key');
	if (!relativeKey) {
		return NextResponse.json({ error: 'error.s3.keyRequired' }, { status: 400 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file');
		if (!(file instanceof File)) {
			return NextResponse.json({ error: 'error.s3.fileRequired' }, { status: 400 });
		}

		const bytes = new Uint8Array(await file.arrayBuffer());
		const client = getS3Client();
		await client.send(
			new PutObjectCommand({
				Bucket: BUCKET,
				Key: toAbsolute(relativeKey),
				Body: bytes,
				ContentType: file.type || 'application/octet-stream',
			}),
		);

		return NextResponse.json({ ok: true, key: relativeKey });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.uploadFailed', detail }, { status: 500 });
	}
}
