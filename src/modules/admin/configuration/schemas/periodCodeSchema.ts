// Period code must match "YYYY-01" | "YYYY-02" | "YYYY-00".
// Mirrors the regex the backend enforces on POST /configuration/periods.
export const PERIOD_CODE_REGEX = /^\d{4}-0[012]$/;

export function isValidPeriodCode(value: string): boolean {
	return PERIOD_CODE_REGEX.test(value);
}
