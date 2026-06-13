import { PutObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { resolveUniqueName, validateName } from '../_lib/s3Operations';

/**
 * POST /api/portfolio/s3/text-file
 * Body: { prefix: string, name: string, content?: string }
 * Creates a plain-text comment file under `prefix` (a `.txt` extension is added
 * when the name has none). Auto-renames on collision.
 */
export async function POST(request: NextRequest) {
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
		const client = getS3Client();
		const unique = await resolveUniqueName(client, prefix, fileName, false);
		const key = `${prefix}${unique}`;

		await client.send(
			new PutObjectCommand({
				Bucket: BUCKET,
				Key: key,
				Body: content,
				ContentType: 'text/plain; charset=utf-8',
			}),
		);

		return NextResponse.json({ ok: true, key });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'error.s3.createCommentFailed';
		return NextResponse.json(
			{ error: 'error.s3.createCommentFailed', detail: message },
			{ status: 500 },
		);
	}
}
