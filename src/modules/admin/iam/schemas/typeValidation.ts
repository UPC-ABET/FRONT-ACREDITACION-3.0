import type { ModuleTypeFormValues, PermissionTypeFormValues, TypeFormErrors } from '../types';

function validateName(
	name: Record<string, string>,
	languages: string[],
	errors: TypeFormErrors,
): void {
	const missingName = languages.some((language) => !(name[language] ?? '').trim());
	if (missingName) errors.name = 'admin.iam.types.error.nameRequired';
}

export function validateModuleTypeForm(
	values: ModuleTypeFormValues,
	languages: string[],
): TypeFormErrors {
	const errors: TypeFormErrors = {};
	validateName(values.name, languages, errors);
	if (!values.route.trim()) errors.route = 'admin.iam.types.error.routeRequired';
	if (!values.module.trim()) errors.module = 'admin.iam.types.error.moduleRequired';
	return errors;
}

export function validatePermissionTypeForm(
	values: PermissionTypeFormValues,
	languages: string[],
): TypeFormErrors {
	const errors: TypeFormErrors = {};
	validateName(values.name, languages, errors);
	return errors;
}

export function hasTypeErrors(errors: TypeFormErrors): boolean {
	return Object.keys(errors).length > 0;
}
