import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import { listAllKeys } from '../_lib/s3Operations';

/**
 * GET /api/portfolio/s3/all-keys?prefix=EPE/
 * Returns every object key under the prefix — used to render the full tree view.
 */
export async function GET(request: NextRequest) {
	try {
		const prefix = request.nextUrl.searchParams.get('prefix') ?? '';
		const client = getS3Client();
		const keys = await listAllKeys(client, prefix);
		return NextResponse.json({ prefix, keys });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'error.s3.treeFailed';
		return NextResponse.json({ error: 'error.s3.treeFailed', detail: message }, { status: 500 });
	}
}
