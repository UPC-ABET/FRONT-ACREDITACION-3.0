import type { AvailableSection } from '../../../types';

export interface CourseGroup {
	courseId: number;
	courseName: string;
	sections: AvailableSection[];
}

/** Safely extract a display string from a value that may be I18nText at runtime. */
export function toStr(value: unknown, fallback = ''): string {
	if (typeof value === 'string') return value;
	if (value && typeof value === 'object') {
		const obj = value as Record<string, unknown>;
		const s = obj.es ?? obj.en ?? '';
		if (typeof s === 'string') return s;
	}
	return fallback;
}
