import { GetObjectCommand } from '@aws-sdk/client-s3';
import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { BUCKET, getS3Client } from '../_lib/s3Client';
import { requireAuth } from '../_lib/auth';
import { toAbsolute } from '../_lib/scope';
import { isFolderKey, listAllKeys, parentPrefix } from '../_lib/s3Operations';

// Longest shared parent prefix, so the zip is rooted at the user's current folder, not the bucket root.
function commonParent(keys: string[]): string {
	if (keys.length === 0) return '';
	let base = parentPrefix(keys[0]);
	for (const key of keys) {
		while (base && !key.startsWith(base)) base = parentPrefix(base.slice(0, -1));
	}
	return base;
}

export async function POST(request: NextRequest) {
	const denied = await requireAuth(request);
	if (denied) return denied;

	try {
		const { keys } = (await request.json()) as { keys?: string[] };
		if (!Array.isArray(keys) || keys.length === 0) {
			return NextResponse.json({ error: 'error.s3.noSelection' }, { status: 400 });
		}

		const absoluteKeys = keys.map(toAbsolute);
		const base = commonParent(absoluteKeys);
		const client = getS3Client();

		const fileKeys: string[] = [];
		for (const key of absoluteKeys) {
			if (isFolderKey(key)) {
				for (const child of await listAllKeys(client, key)) {
					if (!child.endsWith('/')) fileKeys.push(child);
				}
			} else {
				fileKeys.push(key);
			}
		}

		if (fileKeys.length === 0) {
			return NextResponse.json({ error: 'error.s3.emptyFolder' }, { status: 404 });
		}

		const zip = new JSZip();
		for (const key of fileKeys) {
			const obj = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
			const bytes = await obj.Body?.transformToByteArray();
			if (bytes) zip.file(key.slice(base.length), bytes);
		}

		const content = await zip.generateAsync({ type: 'nodebuffer' });

		return new NextResponse(new Uint8Array(content), {
			headers: {
				'Content-Type': 'application/zip',
				'Content-Disposition': 'attachment; filename="portfolio-selection.zip"',
			},
		});
	} catch (err) {
		const detail = err instanceof Error ? err.message : 'unknown';
		return NextResponse.json({ error: 'error.s3.downloadFolderFailed', detail }, { status: 500 });
	}
}
