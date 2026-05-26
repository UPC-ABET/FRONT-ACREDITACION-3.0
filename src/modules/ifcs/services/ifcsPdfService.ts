import { apiGetBlobResponse, apiPostBlobResponse } from '@/shared/lib';
import { parseFilename } from '@/shared/utils';

export async function downloadIfcPdf(
	ifcId: number,
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	const { blob, response } = await apiGetBlobResponse(
		`/ifcs/${ifcId}/pdf?lang=${lang}`,
		{ accept: 'application/pdf' },
	);
	const filename = parseFilename(response.headers.get('Content-Disposition'), `IFC-${ifcId}.pdf`);
	return { blob, filename };
}

export async function downloadIfcPdfBulk(
	ifcIds: number[],
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	const { blob, response } = await apiPostBlobResponse(
		'/ifcs/pdf/bulk',
		{ ifc_ids: ifcIds.map(Number), lang },
		{ accept: 'application/zip' },
	);
	const filename = parseFilename(
		response.headers.get('Content-Disposition'),
		`ZIP_IFC_${lang.toUpperCase()}.zip`,
	);
	return { blob, filename };
}
