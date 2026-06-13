import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth, requirePortfolioScope } from '../_lib/requireAuth';

/** GET /api/portfolio/s3/download-url?key=portfolio/... — presigned URL (1h). */
export async function GET(request: NextRequest) {
	const authError = requireAuth(request);
	if (authError) return authError;

	const key = request.nextUrl.searchParams.get('key');
	if (!key) {
		return NextResponse.json({ error: 'error.s3.keyRequired' }, { status: 400 });
	}
	if (!requirePortfolioScope(key)) {
		return NextResponse.json({ error: 'error.s3.invalidKeyScope' }, { status: 400 });
	}

	try {
		const client = getS3Client();
		const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
			expiresIn: 3600,
		});
		return NextResponse.json({ url });
	} catch {
		return NextResponse.json({ error: 'error.s3.presignFailed' }, { status: 500 });
	}
}
