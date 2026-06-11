import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';

/**
 * POST /api/portfolio/s3/folder
 * Body: { prefix: string, name: string }
 * Creates an empty folder placeholder object (`{prefix}{name}/`).
 */
export async function POST(request: NextRequest) {
	try {
		const { prefix = '', name } = (await request.json()) as { prefix?: string; name?: string };

		const clean = (name ?? '').trim().replace(/[/\\]/g, '');
		if (!clean) {
			return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 });
		}

		const key = `${prefix}${clean}/`;
		const client = getS3Client();
		await client.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: '' }));

		return NextResponse.json({ ok: true, key });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'S3 create folder error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
