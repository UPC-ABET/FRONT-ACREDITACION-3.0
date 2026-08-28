'use client';

import { useEffect, useState } from 'react';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Toast,
} from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { useUpdateApiToken } from '../hooks/useApiTokens';
import { apiTokenEditFormSchema } from '../schemas/apiTokenValidation';
import type { ApiToken } from '../types';

function toDateInputValue(isoDate: string | null): string {
	return isoDate ? isoDate.slice(0, 10) : '';
}

function toIsoDateString(dateInputValue: string): string {
	return new Date(`${dateInputValue}T00:00:00.000Z`).toISOString();
}

interface ApiTokenEditDialogProps {
	token: ApiToken | null;
	onOpenChange: (open: boolean) => void;
}

export function ApiTokenEditDialog({ token, onOpenChange }: ApiTokenEditDialogProps) {
	const { t } = useI18n();
	const updateApiToken = useUpdateApiToken();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [name, setName] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [formError, setFormError] = useState<string | null>(null);

	useEffect(() => {
		if (token) {
			// eslint-disable-next-line react-hooks/set-state-in-effect -- sync editable fields when the target token changes
			setName(token.name);
			setExpiresAt(toDateInputValue(token.expiresAt));
			setFormError(null);
		}
	}, [token]);

	function handleOpenChange(next: boolean) {
		onOpenChange(next);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!token) return;

		const result = apiTokenEditFormSchema.safeParse({
			name,
			expiresAt: expiresAt ? toIsoDateString(expiresAt) : null,
		});
		if (!result.success) {
			setFormError(tryTranslate(t, result.error.issues[0].message));
			return;
		}
		setFormError(null);

		const originalExpiresAt = toDateInputValue(token.expiresAt);
		const expiresAtChanged = expiresAt !== originalExpiresAt;

		updateApiToken.mutate(
			{
				id: token.id,
				body: {
					name: result.data.name,
					...(expiresAtChanged && { expiresAt: result.data.expiresAt }),
				},
			},
			{
				onSuccess: () => {
					showToast(t('admin.apiTokens.edit.toast.saved'), 'success');
					onOpenChange(false);
				},
				onError: (err) => {
					showToast(
						err instanceof Error
							? tryTranslate(t, err.message)
							: t('admin.apiTokens.edit.error.saveFailed'),
						'error',
					);
				},
			},
		);
	}

	return (
		<>
			<Dialog open={token != null} onOpenChange={handleOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t('admin.apiTokens.edit.title')}</DialogTitle>
					</DialogHeader>

					<form className="space-y-4" onSubmit={handleSubmit}>
						<Input
							label={t('admin.apiTokens.edit.form.name')}
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>

						<Input
							type="date"
							label={t('admin.apiTokens.edit.form.expiresAt')}
							value={expiresAt}
							onChange={(e) => setExpiresAt(e.target.value)}
							helperText={t('admin.apiTokens.edit.form.expiresAtHelp')}
						/>

						{formError && <p className="text-xs text-red-600">{formError}</p>}

						<DialogFooter>
							<Button
								type="button"
								variant="secondary"
								onClick={() => handleOpenChange(false)}
								disabled={updateApiToken.isPending}>
								{t('dialog.actions.cancel')}
							</Button>
							<Button
								type="submit"
								variant="primary"
								disabled={updateApiToken.isPending}
								loading={updateApiToken.isPending}>
								{t('dialog.actions.save')}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</>
	);
}
