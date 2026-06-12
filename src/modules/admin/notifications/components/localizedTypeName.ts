import type { I18nText } from '@/shared/types';

/** Resolve a localized name with sensible fallbacks (locale → es → en → fallback). */
export function localizedTypeName(
	text: I18nText | null | undefined,
	locale: string,
	fallback = '',
): string {
	if (!text) return fallback;
	return text[locale] ?? text.es ?? text.en ?? fallback;
}
