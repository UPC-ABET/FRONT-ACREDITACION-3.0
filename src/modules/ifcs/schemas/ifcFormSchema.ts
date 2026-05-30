import type { I18nText, IFCField, IFCFormState } from '../types';

export function hasAnyLang(value: I18nText | undefined, languages: string[]): boolean {
	if (!value) return false;
	return languages.some((l) => value[l]?.trim());
}

export function validateIFCForm(
	state: IFCFormState,
	ifcFields: IFCField[],
	languages: string[],
): string | null {
	const missingRequired = ifcFields
		.filter((f) => f.required)
		.some((f) => !hasAnyLang(state.information[f.key], languages));
	if (missingRequired) return 'ifcs.form.err.requiredFields';

	if (state.findings.length === 0) return 'error.ifc.findingsRequired';

	const findingInvalid = state.findings.some(
		(f) => !hasAnyLang(f.description, languages) || !f.criticalityCode,
	);
	if (findingInvalid) return 'ifcs.form.err.findingIncomplete';

	const actionInvalid = state.actions.some(
		(a) => !hasAnyLang(a.description, languages) || !a.findingTempId,
	);
	if (actionInvalid) return 'ifcs.form.err.actionIncomplete';

	const findingWithoutActions = state.findings.some(
		(f) => !state.actions.some((a) => a.findingTempId === f.tempId),
	);
	if (findingWithoutActions) return 'error.ifc.actionsRequiredPerFinding';

	return null;
}
