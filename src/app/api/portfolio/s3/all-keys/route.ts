import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute, toRelative } from '../_lib/scope';
import { listAllKeys } from '../_lib/s3Operations';

export async function GET(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	try {
		const relativePrefix = request.nextUrl.searchParams.get('prefix') ?? '';
		const client = getS3Client();
		const keys = await listAllKeys(client, toAbsolute(relativePrefix));
		return NextResponse.json({ prefix: relativePrefix, keys: keys.map(toRelative) });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.treeFailed', detail }, { status: 500 });
	}
}
