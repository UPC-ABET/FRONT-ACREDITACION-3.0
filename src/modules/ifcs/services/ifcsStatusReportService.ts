import { buildHeaders, getApiBaseUrl } from '@/shared/lib';
import { parseFilename } from '@/shared/utils';

export async function downloadStatusReport(
	chartIds: number[],
	periodId: number,
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	const url = `${getApiBaseUrl()}/ifcs/status-report`;
	const res = await fetch(url, {
		method: 'POST',
		headers: {
			...buildHeaders(),
			accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		},
		credentials: 'include',
		body: JSON.stringify({
			chart_ids: chartIds.map(Number),
			period_id: Number(periodId),
			lang,
		}),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => res.statusText);
		throw new Error(text || 'ifcs.statusReport.error.downloadFailed');
	}
	const blob = await res.blob();
	const filename = parseFilename(
		res.headers.get('Content-Disposition'),
		lang === 'en' ? 'Status_Report_IFC.xlsx' : 'Reporte_Estado_IFC.xlsx',
	);
	return { blob, filename };
}
