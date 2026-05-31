// Substitutes `{name}` and `{{name}}` placeholders in a template string.
// Use for i18n strings that need runtime parameters, since the project's
// t() helper returns a plain string without expanding placeholders.
export function interpolate(template: string, params: Record<string, string | number>): string {
	return Object.entries(params).reduce((acc, [key, value]) => {
		const stringValue = String(value);
		return acc.split(`{${key}}`).join(stringValue).split(`{{${key}}}`).join(stringValue);
	}, template);
}
