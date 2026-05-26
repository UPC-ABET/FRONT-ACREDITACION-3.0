export function tryTranslate(t: (key: string) => string, key: string): string {
	const translated = t(key);
	return translated === key ? key : translated;
}
