import { authHeader } from '@/shared/lib';
import { parseFilename } from '@/shared/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function readErrorMessage(res: Response, fallbackKey: string): Promise<string> {
	try {
		const body = await res.json();
		return body?.message ?? fallbackKey;
	} catch {
		return fallbackKey;
	}
}

export async function downloadIfcPdf(
	ifcId: number,
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');
	const res = await fetch(`${BASE_URL}/ifcs/${ifcId}/pdf?lang=${lang}`, {
		method: 'GET',
		headers: { accept: 'application/pdf', ...authHeader() },
	});
	if (!res.ok) throw new Error(await readErrorMessage(res, 'ifcs.pdf.error.downloadFailed'));
	const blob = await res.blob();
	const filename = parseFilename(res.headers.get('Content-Disposition'), `IFC-${ifcId}.pdf`);
	return { blob, filename };
}

export async function downloadIfcPdfBulk(
	ifcIds: number[],
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');
	const res = await fetch(`${BASE_URL}/ifcs/pdf/bulk`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			accept: 'application/zip',
			...authHeader(),
		},
		body: JSON.stringify({ ifc_ids: ifcIds.map(Number), lang }),
	});
	if (!res.ok) throw new Error(await readErrorMessage(res, 'ifcs.pdf.error.bulkFailed'));
	const blob = await res.blob();
	const filename = parseFilename(
		res.headers.get('Content-Disposition'),
		`ZIP_IFC_${lang.toUpperCase()}.zip`,
	);
	return { blob, filename };
}
