import type { IFCFieldDescriptor } from '../types';

export interface IFCFieldValidationResult {
	keyMissing: boolean;
	keyDuplicate: boolean;
	esMissing: boolean;
	enMissing: boolean;
}

export function validateIFCFields(fields: IFCFieldDescriptor[]): IFCFieldValidationResult[] {
	const keyCounts = new Map<string, number>();
	for (const f of fields) {
		const k = f.key.trim();
		if (k) keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1);
	}
	const duplicateKeys = new Set(
		[...keyCounts.entries()].filter(([, count]) => count > 1).map(([key]) => key),
	);

	return fields.map((f) => ({
		keyMissing: f.key.trim().length === 0,
		keyDuplicate: f.key.trim().length > 0 && duplicateKeys.has(f.key.trim()),
		esMissing: (f.label.es ?? '').trim().length === 0,
		enMissing: (f.label.en ?? '').trim().length === 0,
	}));
}

export function hasValidationErrors(results: IFCFieldValidationResult[]): boolean {
	return results.some((v) => v.keyMissing || v.keyDuplicate || v.esMissing || v.enMissing);
}

export function validatePrefixValue(value: string): boolean {
	return value.trim().length > 0;
}
