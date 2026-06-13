import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth, requirePortfolioScope } from '../_lib/requireAuth';

/** POST /api/portfolio/s3/upload?key=portfolio/EPE/2023/file.pdf — uploads a single file. */
export async function POST(request: NextRequest) {
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
				Key: key,
				Body: bytes,
				ContentType: file.type || 'application/octet-stream',
			}),
		);

		return NextResponse.json({ ok: true, key });
	} catch {
		return NextResponse.json({ error: 'error.s3.uploadFailed' }, { status: 500 });
	}
}
