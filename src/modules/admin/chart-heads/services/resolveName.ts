import type { I18nText } from '@/shared/types';

export function resolveName(name: string | I18nText): string {
	if (typeof name === 'string') return name;
	return name.es ?? name.en ?? Object.values(name)[0] ?? '';
}
