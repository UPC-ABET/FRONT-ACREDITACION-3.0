import { triggerBrowserDownload } from '@/shared/utils';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function downloadErrorExcel(base64: string, fileName: string): void {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	triggerBrowserDownload(new Blob([bytes], { type: XLSX_MIME }), fileName);
}
