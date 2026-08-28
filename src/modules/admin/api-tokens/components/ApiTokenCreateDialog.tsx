'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Select,
	Toast,
} from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import { tryTranslate } from '@/shared/utils';
import { API_TOKEN_ACTION_OPTIONS, API_TOKEN_MODULE_OPTIONS } from '../constants';
import { useCreateApiToken } from '../hooks/useApiTokens';
import { apiTokenCreateFormSchema } from '../schemas/apiTokenValidation';
import type { ApiTokenScope, IssuedApiToken } from '../types';

interface ScopeRow extends ApiTokenScope {
	id: string;
}

function createScopeRow(): ScopeRow {
	return {
		id: crypto.randomUUID(),
		module: API_TOKEN_MODULE_OPTIONS[0],
		action: API_TOKEN_ACTION_OPTIONS[0],
	};
}

function toIsoDateString(dateInputValue: string): string {
	return new Date(`${dateInputValue}T00:00:00.000Z`).toISOString();
}

interface ApiTokenCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ApiTokenCreateDialog({ open, onOpenChange }: ApiTokenCreateDialogProps) {
	const { t } = useI18n();
	const createApiToken = useCreateApiToken();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [name, setName] = useState('');
	const [scopes, setScopes] = useState<ScopeRow[]>([createScopeRow()]);
	const [expiresAt, setExpiresAt] = useState('');
	const [formError, setFormError] = useState<string | null>(null);
	const [issuedToken, setIssuedToken] = useState<IssuedApiToken | null>(null);

	const moduleOptions = API_TOKEN_MODULE_OPTIONS.map((module) => ({
		value: module,
		label: module,
	}));
	const actionOptions = API_TOKEN_ACTION_OPTIONS.map((action) => ({
		value: action,
		label: action,
	}));

	function reset() {
		setName('');
		setScopes([createScopeRow()]);
		setExpiresAt('');
		setFormError(null);
		setIssuedToken(null);
	}

	function handleOpenChange(next: boolean) {
		if (!next) reset();
		onOpenChange(next);
	}

	function handleAddScope() {
		setScopes((rows) => [...rows, createScopeRow()]);
	}

	function handleRemoveScope(id: string) {
		setScopes((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));
	}

	function handleScopeModuleChange(id: string, module: string) {
		setScopes((rows) => rows.map((row) => (row.id === id ? { ...row, module } : row)));
	}

	function handleScopeActionChange(id: string, action: string) {
		setScopes((rows) => rows.map((row) => (row.id === id ? { ...row, action } : row)));
	}

	function handleCopyApiKey() {
		if (!issuedToken) return;
		navigator.clipboard
			.writeText(issuedToken.apiKey)
			.then(() => showToast(t('admin.apiTokens.create.toast.copied'), 'success'))
			.catch(() => showToast(t('admin.apiTokens.create.error.copyFailed'), 'error'));
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const result = apiTokenCreateFormSchema.safeParse({
			name,
			scopes: scopes.map(({ module, action }) => ({ module, action })),
			expiresAt: expiresAt ? toIsoDateString(expiresAt) : undefined,
		});
		if (!result.success) {
			setFormError(tryTranslate(t, result.error.issues[0].message));
			return;
		}
		setFormError(null);

		createApiToken.mutate(result.data, {
			onSuccess: (data) => {
				setIssuedToken(data);
			},
			onError: (err) => {
				showToast(
					err instanceof Error
						? tryTranslate(t, err.message)
						: t('admin.apiTokens.create.error.createFailed'),
					'error',
				);
			},
		});
	}

	return (
		<>
			<Dialog open={open} onOpenChange={handleOpenChange}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>{t('admin.apiTokens.create.title')}</DialogTitle>
					</DialogHeader>

					{issuedToken ? (
						<div className="space-y-4">
							<p className="text-sm text-zinc-600">
								{t('admin.apiTokens.create.success.description')}
							</p>

							<div className="space-y-2">
								<div className="flex items-end gap-2">
									<div className="flex-1">
										<Input
											label={t('admin.apiTokens.create.success.apiKey')}
											type="text"
											readOnly
											autoComplete="off"
											spellCheck={false}
											value={issuedToken.apiKey}
											className="font-mono"
										/>
									</div>
									<Button type="button" variant="secondary" onClick={handleCopyApiKey}>
										{t('admin.apiTokens.create.success.btn.copy')}
									</Button>
								</div>
								<p className="text-xs text-zinc-500">
									{t('admin.apiTokens.create.success.apiKeyHint')}
								</p>
							</div>

							<DialogFooter>
								<Button type="button" variant="primary" onClick={() => handleOpenChange(false)}>
									{t('admin.apiTokens.create.success.btn.close')}
								</Button>
							</DialogFooter>
						</div>
					) : (
						<form className="space-y-4" onSubmit={handleSubmit}>
							<Input
								label={t('admin.apiTokens.create.form.name')}
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder={t('admin.apiTokens.create.form.namePlaceholder')}
								required
							/>

							<div className="space-y-2">
								<span className="block text-sm font-normal text-zinc-600">
									{t('admin.apiTokens.create.form.scopes')}
								</span>

								<div className="space-y-2">
									{scopes.map((row) => (
										<div key={row.id} className="flex items-end gap-2">
											<div className="flex-1">
												<Select
													label={t('admin.apiTokens.create.form.scopeModule')}
													size="sm"
													value={{ value: row.module, label: row.module }}
													options={moduleOptions}
													onChange={(_, opt) => {
														const next = (opt as { value?: string } | null)?.value;
														if (next) handleScopeModuleChange(row.id, next);
													}}
												/>
											</div>
											<div className="flex-1">
												<Select
													label={t('admin.apiTokens.create.form.scopeAction')}
													size="sm"
													value={{ value: row.action, label: row.action }}
													options={actionOptions}
													onChange={(_, opt) => {
														const next = (opt as { value?: string } | null)?.value;
														if (next) handleScopeActionChange(row.id, next);
													}}
												/>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="text-red-600 hover:bg-red-50"
												onClick={() => handleRemoveScope(row.id)}
												disabled={scopes.length <= 1}
												title={t('admin.apiTokens.create.form.removeScope')}
												aria-label={t('admin.apiTokens.create.form.removeScope')}>
												<TrashIcon className="h-5 w-5" />
											</Button>
										</div>
									))}
								</div>

								<Button type="button" variant="secondary" size="sm" onClick={handleAddScope}>
									<PlusIcon className="h-4 w-4" />
									{t('admin.apiTokens.create.form.addScope')}
								</Button>
							</div>

							<Input
								type="date"
								label={t('admin.apiTokens.create.form.expiresAt')}
								value={expiresAt}
								onChange={(e) => setExpiresAt(e.target.value)}
								helperText={t('admin.apiTokens.create.form.expiresAtHelp')}
							/>

							{formError && <p className="text-xs text-red-600">{formError}</p>}

							<DialogFooter>
								<Button
									type="button"
									variant="secondary"
									onClick={() => handleOpenChange(false)}
									disabled={createApiToken.isPending}>
									{t('dialog.actions.cancel')}
								</Button>
								<Button
									type="submit"
									variant="primary"
									disabled={createApiToken.isPending}
									loading={createApiToken.isPending}>
									{t('admin.apiTokens.create.form.btn.submit')}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</>
	);
}
