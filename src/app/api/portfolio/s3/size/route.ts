import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import { totalSize } from '../_lib/s3Operations';

/**
 * POST /api/portfolio/s3/size
 * Body: { keys: string[] }
 * Returns the combined byte size of the given files/folders (recursive).
 */
export async function POST(request: NextRequest) {
	try {
		const { keys } = (await request.json()) as { keys?: string[] };
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'error.s3.noSelection' }, { status: 400 });
		}

		const client = getS3Client();
		const totalBytes = await totalSize(client, keys);
		return NextResponse.json({ totalBytes });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'error.s3.sizeFailed';
		return NextResponse.json({ error: 'error.s3.sizeFailed', detail: message }, { status: 500 });
	}
}
