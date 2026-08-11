import type { I18nText } from '@/shared/types';

/**
 * Resolves an i18n text to the requested locale, falling back to `fallbackLocale` and then to
 * any other available translation before giving up.
 */
export function localizedText(
	text: Partial<I18nText> | null | undefined,
	locale: string,
	fallbackLocale = 'es',
): string {
	if (!text) return '';
	return text[locale] ?? text[fallbackLocale] ?? Object.values(text).find(Boolean) ?? '';
}
