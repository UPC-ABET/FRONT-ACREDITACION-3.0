import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth, requirePortfolioScope } from '../_lib/requireAuth';

/** POST /api/portfolio/s3/folder — Body: { prefix: string, name: string }. Creates an empty folder placeholder. */
export async function POST(request: NextRequest) {
	const authError = requireAuth(request);
	if (authError) return authError;

	try {
		const { prefix = '', name } = (await request.json()) as { prefix?: string; name?: string };

		const clean = (name ?? '').trim().replace(/[/\\]/g, '');
		if (!clean) {
			return NextResponse.json({ error: 'error.s3.invalidFolderName' }, { status: 400 });
		}

		const key = `${prefix}${clean}/`;
		if (!requirePortfolioScope(key)) {
			return NextResponse.json({ error: 'error.s3.invalidKeyScope' }, { status: 400 });
		}

		const client = getS3Client();
		await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: '' }));

		return NextResponse.json({ ok: true, key });
	} catch {
		return NextResponse.json({ error: 'error.s3.createFolderFailed' }, { status: 500 });
	}
}
