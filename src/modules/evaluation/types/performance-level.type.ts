export type PerformanceLevel = {
  id: string
  name: { en: string; es: string }
  code: string
  /** Grade point value (e.g. 1, 2, 3, 4). Null when the level uses a score range instead. */
  uniqueValue: number | null
  /** Lower bound of the score range (from min_score) */
  minValue: number
  /** Upper bound of the score range (from max_score) */
  maxValue: number
}