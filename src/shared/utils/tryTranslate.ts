import { getApiErrorReasons, getErrorMessage } from '@/shared/lib/apiError';

export function tryTranslate(t: (key: string) => string, key: string): string {
	const translated = t(key);
	return translated === key ? key : translated;
}

export function tryTranslateReason(t: (key: string) => string, key: string): string {
	const separatorIndex = key.indexOf(':');
	if (separatorIndex !== -1) {
		const baseKey = key.slice(0, separatorIndex);
		const parameter = key.slice(separatorIndex + 1);
		const translated = t(baseKey);
		if (translated !== baseKey) return translated.replace('{{code}}', parameter);
	}
	return tryTranslate(t, key);
}

export interface ApiErrorContent {
	title: string;
	reasons: string[];
}

export function resolveApiErrorContent(
	t: (key: string) => string,
	error: unknown,
	fallbackTitleKey: string,
): ApiErrorContent {
	return {
		title: tryTranslateReason(t, getErrorMessage(error, fallbackTitleKey)),
		reasons: getApiErrorReasons(error).map((reason) => tryTranslateReason(t, reason)),
	};
}
