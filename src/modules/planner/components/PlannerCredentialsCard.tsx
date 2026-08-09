'use client';

import { useState, type FormEvent } from 'react';
import { Button, Card, Input, Spinner, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { resolveApiErrorContent, type ApiErrorContent } from '@/shared/utils/tryTranslate';
import { usePlannerCredentials, useSavePlannerCredentials } from '../hooks';

export function PlannerCredentialsCard() {
	const { t, locale } = useI18n();
	const { data, isLoading, isError } = usePlannerCredentials();
	const saveCredentials = useSavePlannerCredentials();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [formError, setFormError] = useState<ApiErrorContent | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const formattedUpdatedAt = data?.updatedAt
		? new Date(data.updatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')
		: null;

	const renderCurrentConfig = () => {
		if (isLoading) {
			return (
				<div className="flex items-center gap-2 text-zinc-500">
					<Spinner size="sm" />
					<span>{t('planner.credentials.loading')}</span>
				</div>
			);
		}

		if (isError || !data) {
			return <p className="italic text-red-600">{t('planner.credentials.loadError')}</p>;
		}

		if (!data.configured) {
			return (
				<p className="text-sm italic text-zinc-500">{t('planner.credentials.notConfigured')}</p>
			);
		}

		return (
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-700">
				<span className="font-semibold">{t('planner.credentials.currentLabel')}</span>
				<span>{data.username}</span>
				{formattedUpdatedAt && (
					<span className="text-zinc-500">
						· {t('planner.credentials.updatedAtLabel')} {formattedUpdatedAt}
					</span>
				)}
			</div>
		);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFormError(null);
		setSaveSuccess(false);

		saveCredentials.mutate(
			{ username, password },
			{
				onSuccess: () => setSaveSuccess(true),
				onError: (error) =>
					setFormError(resolveApiErrorContent(t, error, 'planner.credentials.saveError')),
				onSettled: () => setPassword(''),
			},
		);
	};

	return (
		<Card
			title={t('planner.credentials.title')}
			description={t('planner.credentials.subtitle')}
			className="overflow-visible">
			<div className="space-y-4">
				{renderCurrentConfig()}

				<form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
					<Input
						label={t('planner.credentials.usernameLabel')}
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						required
					/>
					<Input
						type="password"
						label={t('planner.credentials.passwordLabel')}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						required
					/>
					<Button type="submit" loading={saveCredentials.isPending}>
						{t('planner.credentials.save')}
					</Button>
				</form>
			</div>

			<Toast
				isOpen={formError !== null}
				onClose={() => setFormError(null)}
				type="error"
				message={formError?.title}
				reasons={formError?.reasons}
			/>
			<Toast
				isOpen={saveSuccess}
				onClose={() => setSaveSuccess(false)}
				type="success"
				message={t('planner.credentials.saveSuccess')}
			/>
		</Card>
	);
}
