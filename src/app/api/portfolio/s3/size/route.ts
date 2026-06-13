import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute } from '../_lib/scope';
import { totalSize } from '../_lib/s3Operations';

export async function POST(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	try {
		const { keys } = (await request.json()) as { keys?: string[] };
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'error.s3.noSelection' }, { status: 400 });
		}

		const client = getS3Client();
		const totalBytes = await totalSize(client, keys.map(toAbsolute));
		return NextResponse.json({ totalBytes });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.sizeFailed', detail }, { status: 500 });
	}
}
