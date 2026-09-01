// Period code is 6 digits: 4-digit year + 2-digit term code (e.g. "202610", "202625").
export const PERIOD_CODE_REGEX = /^\d{6}$/;

export function isValidPeriodCode(value: string): boolean {
	return PERIOD_CODE_REGEX.test(value);
}
