import type { I18nText } from '@/shared/types';

export function localizedText(text: I18nText, locale: string, fallbackLocale = 'es'): string {
	return text[locale] ?? text[fallbackLocale] ?? '';
}
