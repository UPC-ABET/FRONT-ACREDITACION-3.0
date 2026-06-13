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
	Input,
} from '@/shared/components';
import { useI18n } from '@/providers';
import { useLanguages } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/lib/apiError';
import type { I18nText } from '@/shared/types';
import { useModuleTypeMutations } from '../../hooks';
import { hasTypeErrors, validateModuleTypeForm } from '../../schemas';
import type { IamType, ModuleTypeFormValues, TypeFormErrors } from '../../types';

type Props = {
	open: boolean;
	module: IamType | null;
	typeGroupId: number | null;
	onClose: () => void;
	onSuccess: (messageKey: string) => void;
	onError: (message: string) => void;
};

function initialValues(module: IamType | null): ModuleTypeFormValues {
	return {
		name: module ? { ...module.name } : {},
		route: module?.extra?.route ?? '',
		module: module?.extra?.module ?? '',
	};
}

export function ModuleTypeFormDialog({
	open,
	module,
	typeGroupId,
	onClose,
	onSuccess,
	onError,
}: Props) {
	const { t } = useI18n();
	const languages = useLanguages();
	const { create, update } = useModuleTypeMutations();
	const [values, setValues] = useState<ModuleTypeFormValues>(() => initialValues(module));
	const [errors, setErrors] = useState<TypeFormErrors>({});
	const saving = create.isPending || update.isPending;
	const isEditing = module != null;

	const handleSubmit = async () => {
		const nextErrors = validateModuleTypeForm(values, languages);
		setErrors(nextErrors);
		if (hasTypeErrors(nextErrors)) return;

		const name = values.name as I18nText;
		const extra = { route: values.route.trim(), module: values.module.trim() };

		try {
			if (isEditing) {
				await update.mutateAsync({ id: module.id, body: { name, extra } });
				onSuccess('admin.iam.modules.toast.updated');
			} else {
				if (typeGroupId == null) {
					onError(t('admin.iam.types.error.saveFailed'));
					return;
				}
				await create.mutateAsync({ typeGroupId, name, extra });
				onSuccess('admin.iam.modules.toast.created');
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
							isEditing ? 'admin.iam.modules.form.editTitle' : 'admin.iam.modules.form.createTitle',
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<I18nTextField
						as="input"
						layout="row"
						label={t('admin.iam.modules.form.name')}
						required
						value={values.name}
						onChange={(name) => setValues((prev) => ({ ...prev, name }))}
						error={errors.name ? t(errors.name) : undefined}
					/>
					<Input
						label={t('admin.iam.modules.form.route')}
						placeholder={t('admin.iam.modules.form.routePlaceholder')}
						value={values.route}
						onChange={(event) => setValues((prev) => ({ ...prev, route: event.target.value }))}
						error={errors.route ? t(errors.route) : undefined}
						required
					/>
					<Input
						label={t('admin.iam.modules.form.module')}
						placeholder={t('admin.iam.modules.form.modulePlaceholder')}
						value={values.module}
						onChange={(event) => setValues((prev) => ({ ...prev, module: event.target.value }))}
						error={errors.module ? t(errors.module) : undefined}
						required
					/>
				</div>

				<DialogFooter>
					<Button variant="secondary" disabled={saving} onClick={onClose}>
						{t('dialog.actions.cancel')}
					</Button>
					<Button variant="primary" disabled={saving} onClick={handleSubmit}>
						{saving ? t('loading.default') : t('dialog.actions.save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
