import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';

/** GET /api/portfolio/s3/download-url?key=... — presigned URL (1h) for a single object. */
export async function GET(request: NextRequest) {
	const key = request.nextUrl.searchParams.get('key');
	if (!key) {
		return NextResponse.json({ error: 'Missing key' }, { status: 400 });
	}

	try {
		const client = getS3Client();
		const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
			expiresIn: 3600,
		});
		return NextResponse.json({ url });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'S3 presign error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
