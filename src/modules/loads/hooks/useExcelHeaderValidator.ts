import { useCallback } from 'react';
import * as ExcelJS from 'exceljs';

export interface HeaderValidation {
	ok: boolean;
	missing: string[];
	unexpected: string[];
	actualHeaders: string[];
}

// Strip combining diacritics (U+0300..U+036F) for case- and accent-insensitive header matching.
function normalize(s: string): string {
	return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function useExcelHeaderValidator() {
	return useCallback(async (file: File, expectedHeaders: string[]): Promise<HeaderValidation> => {
		const buffer = await file.arrayBuffer();
		const wb = new ExcelJS.Workbook();
		await wb.xlsx.load(buffer);
		const ws = wb.worksheets[0];
		if (!ws) {
			return { ok: false, missing: expectedHeaders, unexpected: [], actualHeaders: [] };
		}

		const headerRow = ws.getRow(1);
		const actualHeaders: string[] = [];
		headerRow.eachCell((cell) => {
			const v = cell.value;
			actualHeaders.push(v === null || v === undefined ? '' : String(v));
		});

		const actualNorm = new Set(actualHeaders.map(normalize).filter(Boolean));
		const expectedNorm = expectedHeaders.map(normalize);

		const missing = expectedHeaders.filter((_, i) => !actualNorm.has(expectedNorm[i]));
		const unexpected = actualHeaders.filter((h) => h && !expectedNorm.includes(normalize(h)));

		return { ok: missing.length === 0, missing, unexpected, actualHeaders };
	}, []);
}
