import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute } from '../_lib/scope';
import { deleteKeys, isFolderKey, listAllKeys } from '../_lib/s3Operations';

export async function POST(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	try {
		const { keys } = (await request.json()) as { keys?: string[] };
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'error.s3.noSelection' }, { status: 400 });
		}

		const client = getS3Client();
		const toDelete = new Set<string>();

		for (const relativeKey of keys) {
			const key = toAbsolute(relativeKey);
			if (isFolderKey(key)) {
				for (const child of await listAllKeys(client, key)) toDelete.add(child);
				toDelete.add(key);
			} else {
				toDelete.add(key);
			}
		}

		await deleteKeys(client, [...toDelete]);
		return NextResponse.json({ ok: true, deleted: toDelete.size });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.deleteFailed', detail }, { status: 500 });
	}
}
