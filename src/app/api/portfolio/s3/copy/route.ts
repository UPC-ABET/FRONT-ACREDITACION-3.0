import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import {
	copyObject,
	copyPrefix,
	isFolderKey,
	lastSegment,
	resolveUniqueName,
} from '../_lib/s3Operations';

/**
 * POST /api/portfolio/s3/copy
 * Body: { keys: string[], destPrefix: string }
 * Copies files/folders into `destPrefix`, auto-renaming on name collisions.
 */
export async function POST(request: NextRequest) {
	try {
		const { keys, destPrefix = '' } = (await request.json()) as {
			keys?: string[];
			destPrefix?: string;
		};
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'error.s3.noSelection' }, { status: 400 });
		}

		const client = getS3Client();
		for (const key of keys) {
			const folder = isFolderKey(key);
			const name = await resolveUniqueName(client, destPrefix, lastSegment(key), folder);
			if (folder) {
				await copyPrefix(client, key, `${destPrefix}${name}/`);
			} else {
				await copyObject(client, key, `${destPrefix}${name}`);
			}
		}

		return NextResponse.json({ ok: true, count: keys.length });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'error.s3.copyFailed';
		return NextResponse.json({ error: 'error.s3.copyFailed', detail: message }, { status: 500 });
	}
}
