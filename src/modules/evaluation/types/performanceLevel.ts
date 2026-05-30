export type PerformanceLevel = {
	id: string;
	name: { en: string; es: string };
	code: string;
	/** Grade point value (e.g. 1, 2, 3, 4). Null when the level uses a score range instead. */
	uniqueValue: number | null;
	/** Lower bound of the score range (from minScore) */
	minValue: number;
	/** Upper bound of the score range (from maxScore) */
	maxValue: number;
	/** Optional hex color from extra.color (e.g. "#d12323"). Null when not set. */
	color: string | null;
};
