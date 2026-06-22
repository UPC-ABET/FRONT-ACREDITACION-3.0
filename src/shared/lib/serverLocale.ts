import { cookies } from 'next/headers';
import esMessages from '@/language/locales/es.json';
import enMessages from '@/language/locales/en.json';
import { DEFAULT_LOCALE } from '@/shared/constants';

type Locale = 'es' | 'en';

interface Messages {
	[key: string]: string | Messages;
}

const LOCALE_COOKIE = 'appLocale';

const messages: Record<Locale, Messages> = {
	es: esMessages,
	en: enMessages,
};

function resolveMessage(locale: Locale, key: string): string {
	const parts = key.split('.');
	let current: string | Messages | undefined = messages[locale];

	for (const part of parts) {
		if (!current || typeof current !== 'object') return key;
		current = current[part];
	}

	return typeof current === 'string' ? current : key;
}

export async function getServerLocale(): Promise<Locale> {
	const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
	return stored === 'es' || stored === 'en' ? stored : DEFAULT_LOCALE;
}

export async function translateServer(key: string): Promise<string> {
	return resolveMessage(await getServerLocale(), key);
}
