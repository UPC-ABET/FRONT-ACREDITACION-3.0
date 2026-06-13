import type { I18nText } from '@/shared/types';

export function localizedTypeName(
	text: I18nText | null | undefined,
	locale: string,
	fallback = '',
): string {
	if (!text) return fallback;
	return text[locale] ?? text.es ?? text.en ?? fallback;
}
