export function interpolate(template: string, params: Record<string, string | number>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
		key in params ? String(params[key]) : match,
	);
}
