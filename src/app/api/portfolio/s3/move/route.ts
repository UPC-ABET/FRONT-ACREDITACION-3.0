import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import {
	copyObject,
	copyPrefix,
	deleteKeys,
	deletePrefix,
	isFolderKey,
	lastSegment,
	parentPrefix,
	resolveUniqueName,
} from '../_lib/s3Operations';

/**
 * POST /api/portfolio/s3/move
 * Body: { keys: string[], destPrefix: string }
 * Moves files/folders into `destPrefix` (copy + delete), auto-renaming on collisions.
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

		// Reject no-op / invalid destinations up front.
		for (const key of keys) {
			if (parentPrefix(key) === destPrefix) {
				return NextResponse.json({ error: 'error.s3.moveSameLocation' }, { status: 400 });
			}
			if (isFolderKey(key) && destPrefix.startsWith(key)) {
				return NextResponse.json({ error: 'error.s3.moveIntoItself' }, { status: 400 });
			}
		}

		const client = getS3Client();
		for (const key of keys) {
			const folder = isFolderKey(key);
			const name = await resolveUniqueName(client, destPrefix, lastSegment(key), folder);
			if (folder) {
				await copyPrefix(client, key, `${destPrefix}${name}/`);
				await deletePrefix(client, key);
			} else {
				await copyObject(client, key, `${destPrefix}${name}`);
				await deleteKeys(client, [key]);
			}
		}

		return NextResponse.json({ ok: true, count: keys.length });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'error.s3.moveFailed';
		return NextResponse.json({ error: 'error.s3.moveFailed', detail: message }, { status: 500 });
	}
}
