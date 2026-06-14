import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute } from '../_lib/scope';

export async function GET(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	const relativeKey = request.nextUrl.searchParams.get('key');
	if (!relativeKey) {
		return NextResponse.json({ error: 'error.s3.keyRequired' }, { status: 400 });
	}

	try {
		const client = getS3Client();
		const url = await getSignedUrl(
			client,
			new GetObjectCommand({ Bucket: BUCKET, Key: toAbsolute(relativeKey) }),
			{ expiresIn: 3600 },
		);
		return NextResponse.json({ url });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.downloadUrlFailed', detail }, { status: 500 });
	}
}
