'use client';

import { useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	I18nTextField,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { useLanguages } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { I18nText } from '@/shared/types';
import { usePermissionTypeMutations } from '../../hooks';
import { hasTypeErrors, validatePermissionTypeForm } from '../../schemas';
import type { IamType, PermissionTypeFormValues, TypeFormErrors } from '../../types';

type Props = {
	open: boolean;
	permission: IamType | null;
	typeGroupId: number | null;
	onClose: () => void;
	onSuccess: (messageKey: string) => void;
	onError: (message: string) => void;
};

function initialValues(permission: IamType | null): PermissionTypeFormValues {
	return {
		name: permission ? { ...permission.name } : {},
	};
}

export function PermissionTypeFormDialog({
	open,
	permission,
	typeGroupId,
	onClose,
	onSuccess,
	onError,
}: Props) {
	const { t } = useI18n();
	const languages = useLanguages();
	const { create, update } = usePermissionTypeMutations();
	const [values, setValues] = useState<PermissionTypeFormValues>(() => initialValues(permission));
	const [errors, setErrors] = useState<TypeFormErrors>({});
	const saving = create.isPending || update.isPending;
	const isEditing = permission != null;

	const handleSubmit = async () => {
		const nextErrors = validatePermissionTypeForm(values, languages);
		setErrors(nextErrors);
		if (hasTypeErrors(nextErrors)) return;

		const name = values.name as I18nText;

		try {
			if (isEditing) {
				await update.mutateAsync({ id: permission.id, body: { name } });
				onSuccess('admin.iam.permissions.toast.updated');
			} else {
				if (typeGroupId == null) {
					onError(t('admin.iam.types.error.saveFailed'));
					return;
				}
				await create.mutateAsync({ typeGroupId, name });
				onSuccess('admin.iam.permissions.toast.created');
			}
			onClose();
		} catch (error) {
			onError(getErrorMessage(error, 'admin.iam.types.error.saveFailed'));
		}
	};

	return (
		<Dialog open={open} onOpenChange={(next) => !next && onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{t(
							isEditing
								? 'admin.iam.permissions.form.editTitle'
								: 'admin.iam.permissions.form.createTitle',
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<I18nTextField
						as="input"
						layout="row"
						label={t('admin.iam.permissions.form.name')}
						required
						value={values.name}
						onChange={(name) => setValues((prev) => ({ ...prev, name }))}
						error={errors.name ? t(errors.name) : undefined}
					/>
				</div>

				<DialogFooter>
					<Button variant="secondary" disabled={saving} onClick={onClose}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={saving} onClick={handleSubmit} loading={saving}>
						{t('dialog.actions.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
