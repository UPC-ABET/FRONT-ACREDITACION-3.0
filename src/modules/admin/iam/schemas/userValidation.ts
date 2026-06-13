import type { UserFormErrors, UserFormValues } from '../types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUserForm(values: UserFormValues): UserFormErrors {
	const errors: UserFormErrors = {};

	if (!values.firstName.trim()) errors.firstName = 'admin.iam.users.error.firstNameRequired';
	if (!values.lastName.trim()) errors.lastName = 'admin.iam.users.error.lastNameRequired';

	const email = values.email.trim();
	if (!email) errors.email = 'admin.iam.users.error.emailRequired';
	else if (!EMAIL_PATTERN.test(email)) errors.email = 'admin.iam.users.error.emailInvalid';

	return errors;
}

export function hasUserErrors(errors: UserFormErrors): boolean {
	return Object.keys(errors).length > 0;
}
