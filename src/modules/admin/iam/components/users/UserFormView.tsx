'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, Input, Select, Toggle } from '@/shared/components';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/apiError';
import { useDocumentTypes, useRoles, useSaveUser, useUserRoles } from '../../hooks';
import { hasUserErrors, validateUserForm } from '../../schemas';
import type { IamUser, UserCreateBody, UserFormErrors } from '../../types';
import { localizedText } from '../localizedText';
import { UserRolesField } from './UserRolesField';

type Props = {
	user: IamUser | null;
	onCancel: () => void;
	onSuccess: (messageKey: string) => void;
	onError: (message: string) => void;
};

export function UserFormView({ user, onCancel, onSuccess, onError }: Props) {
	const { t, locale } = useI18n();
	const saveUser = useSaveUser();
	const isEditing = user != null;

	const { data: roles = [], isLoading: rolesLoading } = useRoles();
	const { data: documentTypes = [] } = useDocumentTypes();
	const { data: userRoleLinks = [], isLoading: userRolesLoading } = useUserRoles(user?.id ?? null);

	const [firstName, setFirstName] = useState(user?.firstName ?? '');
	const [lastName, setLastName] = useState(user?.lastName ?? '');
	const [email, setEmail] = useState(user?.email ?? '');
	const [phone, setPhone] = useState(user?.phone ?? '');
	const [documentTypeId, setDocumentTypeId] = useState<number | null>(user?.documentTypeId ?? null);
	const [documentCode, setDocumentCode] = useState(user?.documentCode ?? '');
	const [isActive, setIsActive] = useState(user?.isActive ?? true);
	const [roleIds, setRoleIds] = useState<number[]>([]);
	const [errors, setErrors] = useState<UserFormErrors>({});

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- sync role selection with loaded assignments
		setRoleIds(userRoleLinks.map((link) => link.roleId));
	}, [userRoleLinks]);

	const documentTypeOptions = useMemo(
		() =>
			documentTypes.map((type) => ({
				value: type.id,
				label: localizedText(type.name, locale, type.code),
			})),
		[documentTypes, locale],
	);

	const selectedDocumentType =
		documentTypeOptions.find((option) => option.value === documentTypeId) ?? null;

	const saving = saveUser.isPending;

	const handleSubmit = async () => {
		const values = {
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentCode,
			isActive,
			roleIds,
		};
		const nextErrors = validateUserForm(values);
		setErrors(nextErrors);
		if (hasUserErrors(nextErrors)) return;

		const body: UserCreateBody = {
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			email: email.trim(),
			isActive,
			...(phone.trim() ? { phone: phone.trim() } : {}),
			...(documentTypeId != null ? { documentTypeId } : {}),
			...(documentCode.trim() ? { documentCode: documentCode.trim() } : {}),
		};

		try {
			await saveUser.mutateAsync({
				id: user?.id ?? null,
				body,
				roleIds,
				currentRoleLinks: userRoleLinks,
			});
			onSuccess(isEditing ? 'admin.iam.users.toast.updated' : 'admin.iam.users.toast.created');
		} catch (error) {
			onError(getErrorMessage(error, 'admin.iam.users.error.saveFailed'));
		}
	};

	return (
		<div className="space-y-5">
			<Button variant="ghost" size="sm" onClick={onCancel} className="self-start">
				<ArrowLeftIcon className="h-4 w-4" />
				{t('admin.iam.users.form.back')}
			</Button>

			<div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
				<h2 className="text-lg font-bold text-zinc-900">
					{t(isEditing ? 'admin.iam.users.form.editTitle' : 'admin.iam.users.form.createTitle')}
				</h2>

				<div className="grid gap-4 sm:grid-cols-2">
					<Input
						label={t('admin.iam.users.form.firstName')}
						value={firstName}
						onChange={(event) => setFirstName(event.target.value)}
						error={errors.firstName ? t(errors.firstName) : undefined}
						required
					/>
					<Input
						label={t('admin.iam.users.form.lastName')}
						value={lastName}
						onChange={(event) => setLastName(event.target.value)}
						error={errors.lastName ? t(errors.lastName) : undefined}
						required
					/>
					<Input
						label={t('admin.iam.users.form.email')}
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						error={errors.email ? t(errors.email) : undefined}
						required
					/>
					<Input
						label={t('admin.iam.users.form.phone')}
						value={phone}
						onChange={(event) => setPhone(event.target.value)}
					/>
					<Select
						name="documentType"
						label={t('admin.iam.users.form.documentType')}
						placeholder={t('admin.iam.users.form.documentTypePlaceholder')}
						isClearable
						isSearchable
						options={documentTypeOptions}
						value={selectedDocumentType}
						onChange={(_name, value) =>
							setDocumentTypeId(value && !Array.isArray(value) ? Number(value.value) : null)
						}
					/>
					<Input
						label={t('admin.iam.users.form.documentCode')}
						value={documentCode}
						onChange={(event) => setDocumentCode(event.target.value)}
					/>
				</div>

				<div className="flex flex-wrap gap-6">
					<Toggle
						label={t('admin.iam.users.form.isActive')}
						checked={isActive}
						onChange={setIsActive}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex flex-col gap-1">
						<span className="text-base font-semibold text-zinc-900">
							{t('admin.iam.users.form.roles')}
						</span>
						<span className="text-xs text-zinc-500">{t('admin.iam.users.form.rolesHint')}</span>
					</div>
					{rolesLoading || (isEditing && userRolesLoading) ? (
						<p className="text-sm text-zinc-500">{t('loading.default')}</p>
					) : (
						<UserRolesField
							roles={roles}
							selectedRoleIds={roleIds}
							onChange={setRoleIds}
							disabled={saving}
						/>
					)}
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="secondary" disabled={saving} onClick={onCancel}>
					{t('dialog.actions.cancel')}
				</Button>
				<Button variant="primary" disabled={saving} onClick={handleSubmit}>
					{saving ? t('loading.default') : t('dialog.actions.save')}
				</Button>
			</div>
		</div>
	);
}
