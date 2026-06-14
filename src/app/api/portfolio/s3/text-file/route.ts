import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute, toRelative } from '../_lib/scope';
import { resolveUniqueName, validateName } from '../_lib/s3Operations';

export async function POST(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	try {
		const {
			prefix = '',
			name,
			content = '',
		} = (await request.json()) as { prefix?: string; name?: string; content?: string };

		const validationError = validateName(name ?? '');
		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}

		const clean = (name ?? '').trim();
		const fileName = clean.includes('.') ? clean : `${clean}.txt`;
		const destPrefix = toAbsolute(prefix);
		const client = getS3Client();
		const unique = await resolveUniqueName(client, destPrefix, fileName, false);
		const key = `${destPrefix}${unique}`;

		await client.send(
			new PutObjectCommand({
				Bucket: BUCKET,
				Key: key,
				Body: content,
				ContentType: 'text/plain; charset=utf-8',
			}),
		);

		return NextResponse.json({ ok: true, key: toRelative(key) });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.createCommentFailed', detail }, { status: 500 });
	}
}
