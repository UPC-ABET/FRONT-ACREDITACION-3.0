'use client';

import { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button, I18nTextField, Input, Toggle } from '@/shared/components';
import { useI18n } from '@/providers';
import { useLanguages } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { I18nText } from '@/shared/types';
import { useModules, usePermissions, useRoleModulePermissions, useSaveRole } from '../../hooks';
import { hasRoleErrors, validateRoleForm } from '../../schemas';
import type { AdminRole, MatrixCell, RoleFormErrors } from '../../types';
import { RolePermissionMatrix } from './RolePermissionMatrix';

type Props = {
	role: AdminRole | null;
	onCancel: () => void;
	onSuccess: (messageKey: string) => void;
	onError: (message: string) => void;
};

export function RoleFormView({ role, onCancel, onSuccess, onError }: Props) {
	const { t } = useI18n();
	const languages = useLanguages();
	const saveRole = useSaveRole();
	const isEditing = role != null;

	const { data: modules = [], isLoading: modulesLoading } = useModules();
	const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();
	const { data: roleLinks = [], isLoading: linksLoading } = useRoleModulePermissions(
		role?.id ?? null,
	);

	const [code, setCode] = useState(role?.code ?? '');
	const [name, setName] = useState<I18nText>(role ? { ...role.name } : {});
	const [description, setDescription] = useState<I18nText>(
		role?.description ? { ...role.description } : {},
	);
	const [isActive, setIsActive] = useState(role?.isActive ?? true);
	const [cells, setCells] = useState<MatrixCell[]>([]);
	const [errors, setErrors] = useState<RoleFormErrors>({});

	useEffect(() => {
		const next = roleLinks.map((link) => ({
			moduleTypeId: link.moduleTypeId,
			permissionTypeId: link.permissionTypeId,
		}));
		// eslint-disable-next-line react-hooks/set-state-in-effect -- sync matrix selection with loaded assignments
		setCells(next);
	}, [roleLinks]);

	const saving = saveRole.isPending;
	const axesLoading = modulesLoading || permissionsLoading || (isEditing && linksLoading);

	const handleSubmit = async () => {
		const nextErrors = validateRoleForm({ code, name, description, isActive, cells }, languages);
		setErrors(nextErrors);
		if (hasRoleErrors(nextErrors)) return;

		try {
			await saveRole.mutateAsync({
				id: role?.id ?? null,
				body: { code: code.trim(), name, description, isActive },
				cells,
				currentPermissionLinks: roleLinks,
			});
			onSuccess(isEditing ? 'admin.iam.roles.toast.updated' : 'admin.iam.roles.toast.created');
		} catch (error) {
			onError(getErrorMessage(error, 'admin.iam.roles.error.saveFailed'));
		}
	};

	return (
		<div className="space-y-5">
			<Button variant="ghost" size="sm" onClick={onCancel} className="self-start">
				<ArrowLeftIcon className="h-4 w-4" />
				{t('admin.iam.roles.form.back')}
			</Button>

			<div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
				<h2 className="text-lg font-bold text-zinc-900">
					{t(isEditing ? 'admin.iam.roles.form.editTitle' : 'admin.iam.roles.form.createTitle')}
				</h2>

				<div className="grid gap-4 sm:grid-cols-2">
					<Input
						label={t('admin.iam.roles.form.code')}
						value={code}
						onChange={(event) => setCode(event.target.value)}
						error={errors.code ? t(errors.code) : undefined}
						required
					/>
					<div className="flex items-end pb-1">
						<Toggle
							label={t('admin.iam.roles.form.isActive')}
							checked={isActive}
							onChange={setIsActive}
						/>
					</div>
				</div>

				<I18nTextField
					as="input"
					layout="row"
					label={t('admin.iam.roles.form.name')}
					required
					value={name}
					onChange={setName}
					error={errors.name ? t(errors.name) : undefined}
				/>

				<I18nTextField
					layout="row"
					rows={2}
					label={t('admin.iam.roles.form.description')}
					value={description}
					onChange={setDescription}
				/>

				<div className="space-y-2">
					<div className="flex flex-col gap-1">
						<span className="text-base font-semibold text-zinc-900">
							{t('admin.iam.roles.form.permissions')}
						</span>
						<span className="text-xs text-zinc-500">
							{t('admin.iam.roles.form.permissionsHint')}
						</span>
					</div>
					{axesLoading ? (
						<p className="text-sm text-zinc-500">{t('loading.default')}</p>
					) : (
						<RolePermissionMatrix
							modules={modules}
							permissions={permissions}
							value={cells}
							onChange={setCells}
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
