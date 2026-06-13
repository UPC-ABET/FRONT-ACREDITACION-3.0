import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import {
	copyObject,
	copyPrefix,
	deleteKeys,
	deletePrefix,
	isFolderKey,
	keyExists,
	lastSegment,
	parentPrefix,
	validateName,
} from '../_lib/s3Operations';

/**
 * POST /api/portfolio/s3/rename
 * Body: { key: string, newName: string }
 * Renames a file (extension preserved) or a folder (rewrites every child key).
 */
export async function POST(request: NextRequest) {
	try {
		const { key, newName } = (await request.json()) as { key?: string; newName?: string };
		if (!key) {
			return NextResponse.json({ error: 'error.s3.invalidKey' }, { status: 400 });
		}

		const validationError = validateName(newName ?? '');
		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}

		const clean = (newName ?? '').trim();
		const client = getS3Client();
		const parent = parentPrefix(key);

		if (isFolderKey(key)) {
			const newPrefix = `${parent}${clean}/`;
			if (newPrefix === key) return NextResponse.json({ ok: true, key });
			if (await keyExists(client, newPrefix)) {
				return NextResponse.json({ error: 'error.s3.nameExists' }, { status: 409 });
			}
			await copyPrefix(client, key, newPrefix);
			await deletePrefix(client, key);
			return NextResponse.json({ ok: true, key: newPrefix });
		}

		// File: keep the original extension unless the new name already carries one.
		const oldName = lastSegment(key);
		const oldDot = oldName.lastIndexOf('.');
		const oldExt = oldDot > 0 ? oldName.slice(oldDot) : '';
		const newHasExt = clean.lastIndexOf('.') > 0;
		const newKey = `${parent}${clean}${newHasExt ? '' : oldExt}`;
		if (newKey === key) return NextResponse.json({ ok: true, key });
		if (await keyExists(client, newKey)) {
			return NextResponse.json({ error: 'error.s3.nameExists' }, { status: 409 });
		}

		await copyObject(client, key, newKey);
		await deleteKeys(client, [key]);
		return NextResponse.json({ ok: true, key: newKey });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'error.s3.renameFailed';
		return NextResponse.json({ error: 'error.s3.renameFailed', detail: message }, { status: 500 });
	}
}
