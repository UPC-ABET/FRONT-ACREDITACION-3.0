import type { I18nText } from '@/shared/types';

export function localizedText(
	text: I18nText | null | undefined,
	language: string,
	fallback = '',
): string {
	if (!text) return fallback;
	return text[language] ?? text.es ?? text.en ?? fallback;
}
