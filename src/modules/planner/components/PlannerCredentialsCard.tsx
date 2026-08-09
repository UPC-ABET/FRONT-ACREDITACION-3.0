'use client';

import { useState, type FormEvent } from 'react';
import { Button, Card, Input, Spinner, Toast } from '@/shared/components';
import { useI18n } from '@/providers';
import { useApiErrorToast } from '@/shared/hooks';
import { resolveApiErrorContent, type ApiErrorContent } from '@/shared/utils/tryTranslate';
import { usePlannerCredentials, useSavePlannerCredentials } from '../hooks';

export function PlannerCredentialsCard() {
	const { t, locale } = useI18n();
	const { data, isLoading, isError, refetch } = usePlannerCredentials();
	const saveCredentials = useSavePlannerCredentials();
	const { toast, showToast, clearToast } = useApiErrorToast();

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [formError, setFormError] = useState<ApiErrorContent | null>(null);

	// Seed the username field once from the already-configured value, so rotating just the
	// password doesn't require retyping it. Adjusted during render (not an effect) per
	// https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
	const [usernameSeeded, setUsernameSeeded] = useState(false);
	if (!usernameSeeded && data?.username) {
		setUsernameSeeded(true);
		setUsername(data.username);
	}

	const formattedUpdatedAt = data?.updatedAt
		? new Date(data.updatedAt).toLocaleString(locale === 'en' ? 'en-US' : 'es-PE')
		: null;

	const renderBody = () => {
		if (isLoading) {
			return (
				<div className="flex items-center gap-2 text-zinc-500">
					<Spinner size="sm" />
					<span>{t('planner.credentials.loading')}</span>
				</div>
			);
		}

		if (isError || !data) {
			return (
				<div className="flex items-center gap-2">
					<p className="italic text-red-600">{t('planner.credentials.loadError')}</p>
					<Button variant="ghost" size="sm" onClick={() => refetch()}>
						{t('planner.credentials.retry')}
					</Button>
				</div>
			);
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
		clearToast();

		saveCredentials.mutate(
			{ username, password },
			{
				onSuccess: () => showToast(t('planner.credentials.saveSuccess'), 'success'),
				onError: (error) => {
					const content = resolveApiErrorContent(t, error, 'planner.credentials.saveError');
					// Defensive: never let a backend validation message that happens to echo the
					// submitted password back reach the DOM as visible text.
					const reasons = content.reasons.filter(
						(reason) => !password || !reason.includes(password),
					);
					setFormError({ ...content, reasons });
				},
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
				{renderBody()}

				<form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
					<Input
						label={t('planner.credentials.usernameLabel')}
						value={username}
						onChange={(event) => setUsername(event.target.value)}
						autoComplete="username"
						disabled={saveCredentials.isPending}
						required
					/>
					<Input
						type="password"
						label={t('planner.credentials.passwordLabel')}
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						autoComplete="new-password"
						disabled={saveCredentials.isPending}
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
			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</Card>
	);
}
