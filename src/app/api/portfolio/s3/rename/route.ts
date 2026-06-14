import { NextRequest, NextResponse } from 'next/server';
import { getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute, toRelative } from '../_lib/scope';
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

export async function POST(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	try {
		const { key: relativeKey, newName } = (await request.json()) as {
			key?: string;
			newName?: string;
		};
		if (!relativeKey) {
			return NextResponse.json({ error: 'error.s3.invalidKey' }, { status: 400 });
		}

		const validationError = validateName(newName ?? '');
		if (validationError) {
			return NextResponse.json({ error: validationError }, { status: 400 });
		}

		const key = toAbsolute(relativeKey);
		const clean = (newName ?? '').trim();
		const client = getS3Client();
		const parent = parentPrefix(key);

		if (isFolderKey(key)) {
			const newPrefix = `${parent}${clean}/`;
			if (newPrefix === key) return NextResponse.json({ ok: true, key: relativeKey });
			if (await keyExists(client, newPrefix)) {
				return NextResponse.json({ error: 'error.s3.nameExists' }, { status: 409 });
			}
			await copyPrefix(client, key, newPrefix);
			await deletePrefix(client, key);
			return NextResponse.json({ ok: true, key: toRelative(newPrefix) });
		}

		const oldName = lastSegment(key);
		const oldDot = oldName.lastIndexOf('.');
		const oldExt = oldDot > 0 ? oldName.slice(oldDot) : '';
		const newHasExt = clean.lastIndexOf('.') > 0;
		const newKey = `${parent}${clean}${newHasExt ? '' : oldExt}`;
		if (newKey === key) return NextResponse.json({ ok: true, key: relativeKey });
		if (await keyExists(client, newKey)) {
			return NextResponse.json({ error: 'error.s3.nameExists' }, { status: 409 });
		}

		await copyObject(client, key, newKey);
		await deleteKeys(client, [key]);
		return NextResponse.json({ ok: true, key: toRelative(newKey) });
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.renameFailed', detail }, { status: 500 });
	}
}
