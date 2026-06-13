import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute } from '../_lib/scope';
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

export async function POST(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	try {
		const { keys, destPrefix = '' } = (await request.json()) as {
			keys?: string[];
			destPrefix?: string;
		};
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'error.s3.noSelection' }, { status: 400 });
		}

		const dest = toAbsolute(destPrefix);
		for (const relativeKey of keys) {
			const key = toAbsolute(relativeKey);
			if (parentPrefix(key) === dest) {
				return NextResponse.json({ error: 'error.s3.moveSameLocation' }, { status: 400 });
			}
			if (isFolderKey(key) && dest.startsWith(key)) {
				return NextResponse.json({ error: 'error.s3.moveIntoItself' }, { status: 400 });
			}
		}

		const client = getS3Client();
		for (const relativeKey of keys) {
			const key = toAbsolute(relativeKey);
			const folder = isFolderKey(key);
			const name = await resolveUniqueName(client, dest, lastSegment(key), folder);
			if (folder) {
				await copyPrefix(client, key, `${dest}${name}/`);
				await deletePrefix(client, key);
			} else {
				await copyObject(client, key, `${dest}${name}`);
				await deleteKeys(client, [key]);
			}
		}

		return NextResponse.json({ ok: true, count: keys.length });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.moveFailed', detail }, { status: 500 });
	}
}
