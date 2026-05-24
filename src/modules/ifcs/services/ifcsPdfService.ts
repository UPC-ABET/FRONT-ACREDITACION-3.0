import { buildHeaders, getApiBaseUrl, ApiError } from '@/shared/lib';
import { parseFilename } from '@/shared/utils';

export async function downloadIfcPdf(
	ifcId: number,
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	const url = `${getApiBaseUrl()}/ifcs/${ifcId}/pdf?lang=${lang}`;
	const res = await fetch(url, {
		method: 'GET',
		headers: { ...buildHeaders(), accept: 'application/pdf' },
		credentials: 'include',
	});
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new ApiError(text || 'ifcs.pdf.error.downloadFailed');
	}
	const blob = await res.blob();
	const filename = parseFilename(res.headers.get('Content-Disposition'), `IFC-${ifcId}.pdf`);
	return { blob, filename };
}

export async function downloadIfcPdfBulk(
	ifcIds: number[],
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	const url = `${getApiBaseUrl()}/ifcs/pdf/bulk`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { ...buildHeaders(), accept: 'application/zip' },
		credentials: 'include',
		body: JSON.stringify({ ifc_ids: ifcIds.map(Number), lang }),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new ApiError(text || 'ifcs.pdf.error.bulkFailed');
	}
	const blob = await res.blob();
	const filename = parseFilename(
		res.headers.get('Content-Disposition'),
		`ZIP_IFC_${lang.toUpperCase()}.zip`,
	);
	return { blob, filename };
}
