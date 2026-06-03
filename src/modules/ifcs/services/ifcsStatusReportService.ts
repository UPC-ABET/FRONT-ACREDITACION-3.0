import { apiPostBlobResponse } from '@/shared/lib';
import { parseFilename } from '@/shared/utils';

export async function downloadStatusReport(
	chartIds: number[],
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	const { blob, response } = await apiPostBlobResponse(
		'/ifcs/status-report',
		{ chartIds: chartIds.map(Number), lang },
		{ accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
	);
	const filename = parseFilename(
		response.headers.get('Content-Disposition'),
		lang === 'en' ? 'Status_Report_IFC.xlsx' : 'Reporte_Estado_IFC.xlsx',
	);
	return { blob, filename };
}
