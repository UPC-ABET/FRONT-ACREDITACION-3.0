import type { RoleFormErrors, RoleFormValues } from '../types';

export function validateRoleForm(values: RoleFormValues, languages: string[]): RoleFormErrors {
	const errors: RoleFormErrors = {};

	if (!values.code.trim()) errors.code = 'admin.iam.roles.error.codeRequired';

	const missingName = languages.some((code) => !(values.name[code] ?? '').trim());
	if (missingName) errors.name = 'admin.iam.roles.error.nameRequired';

	return errors;
}

export function hasRoleErrors(errors: RoleFormErrors): boolean {
	return Object.keys(errors).length > 0;
}
