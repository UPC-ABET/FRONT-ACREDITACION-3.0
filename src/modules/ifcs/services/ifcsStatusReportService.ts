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

export async function downloadStatusReport(
	chartIds: number[],
	periodId: number,
	lang: 'es' | 'en',
): Promise<{ blob: Blob; filename: string }> {
	if (!BASE_URL) throw new Error('app.missingApiUrl');
	const res = await fetch(`${BASE_URL}/ifcs/status-report`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			...authHeader(),
		},
		credentials: 'include',
		body: JSON.stringify({
			chart_ids: chartIds.map(Number),
			period_id: Number(periodId),
			lang,
		}),
	});
	if (!res.ok)
		throw new Error(await readErrorMessage(res, 'ifcs.statusReport.error.downloadFailed'));
	const blob = await res.blob();
	const filename = parseFilename(
		res.headers.get('Content-Disposition'),
		lang === 'en' ? 'Status_Report_IFC.xlsx' : 'Reporte_Estado_IFC.xlsx',
	);
	return { blob, filename };
}
