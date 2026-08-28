'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Input, Toast } from '@/shared';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import { formatDateTime, interpolate, tryTranslate } from '@/shared/utils';
import { getErrorMessage } from '@/shared/lib';
import { usePortfolioSsoConfig, useUpsertPortfolioSsoConfig } from '../hooks/usePortfolioSsoConfig';
import { portfolioSsoConfigFormSchema } from '../schemas/portfolioSsoValidation';

function generateApiKey(): string {
	return Array.from(crypto.getRandomValues(new Uint8Array(32)))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

export function PortfolioIntegrationForm() {
	const { t } = useI18n();
	const { data, isLoading } = usePortfolioSsoConfig();
	const upsertConfig = useUpsertPortfolioSsoConfig();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [baseUrl, setBaseUrl] = useState('');
	const [apiKey, setApiKey] = useState('');
	const [formError, setFormError] = useState<string | null>(null);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- sync the editable base URL when the fetched config arrives
		setBaseUrl(data?.baseUrl ?? '');
	}, [data?.baseUrl]);

	const statusText = data?.configured
		? interpolate(t('admin.portfolioIntegration.status.configured'), {
				date: data.updatedAt ? formatDateTime(data.updatedAt) : '—',
			})
		: t('admin.portfolioIntegration.status.notConfigured');

	function handleGenerateApiKey() {
		setApiKey(generateApiKey());
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		const result = portfolioSsoConfigFormSchema.safeParse({ baseUrl, apiKey });
		if (!result.success) {
			setFormError(tryTranslate(t, result.error.issues[0].message));
			return;
		}
		setFormError(null);

		upsertConfig.mutate(result.data, {
			onSuccess: () => {
				setApiKey('');
				showToast(t('admin.portfolioIntegration.form.toast.saved'), 'success');
			},
			onError: (err) => {
				setApiKey('');
				showToast(
					getErrorMessage(err, 'admin.portfolioIntegration.form.error.saveFailed'),
					'error',
				);
			},
		});
	}

	return (
		<Card>
			<form className="space-y-6" onSubmit={handleSubmit}>
				<p className="text-sm text-zinc-600">{isLoading ? t('loading.default') : statusText}</p>

				<Input
					label={t('admin.portfolioIntegration.form.baseUrl')}
					type="url"
					value={baseUrl}
					onChange={(e) => setBaseUrl(e.target.value)}
					placeholder={t('admin.portfolioIntegration.form.baseUrlPlaceholder')}
					required
				/>

				<div className="space-y-2">
					<div className="flex items-end gap-2">
						<div className="flex-1">
							<Input
								label={t('admin.portfolioIntegration.form.apiKey')}
								type="password"
								autoComplete="off"
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder={t('admin.portfolioIntegration.form.apiKeyPlaceholder')}
								error={formError ?? undefined}
							/>
						</div>
						<Button type="button" variant="secondary" onClick={handleGenerateApiKey}>
							{t('admin.portfolioIntegration.form.btn.generate')}
						</Button>
					</div>
					<p className="text-xs text-zinc-500">{t('admin.portfolioIntegration.form.apiKeyHint')}</p>
				</div>

				<div className="flex justify-end">
					<Button type="submit" variant="primary" disabled={upsertConfig.isPending}>
						{upsertConfig.isPending
							? t('admin.portfolioIntegration.form.btn.submitting')
							: t('admin.portfolioIntegration.form.btn.submit')}
					</Button>
				</div>
			</form>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
