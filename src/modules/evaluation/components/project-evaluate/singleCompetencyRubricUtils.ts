export function fmtNum(raw: string): string {
	const n = parseFloat(raw);
	if (isNaN(n)) return raw;
	return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function validateScore(
	value: string,
	range: { min: number; max: number },
	msgNaN: string,
	msgRange: string,
): string | undefined {
	if (!value.trim()) return undefined;
	const n = parseFloat(value);
	if (isNaN(n)) return msgNaN;
	if (n < range.min || n > range.max)
		return `${msgRange} (${fmtNum(String(range.min))} – ${fmtNum(String(range.max))})`;
	return undefined;
}

export type Scores = Record<number, Record<number, string>>;
export type DupScores = Record<number, string>;

export type CriteriaScoreEntry = {
	rubricQuestionCriteriaId: number;
	score: number;
	commentaries: Record<string, string>;
};
