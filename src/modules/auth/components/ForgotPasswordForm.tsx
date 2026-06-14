'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, LoadingDialog, ErrorDialog, SuccessDialog } from '@/shared/components';
import { requestForgotPassword } from '@/modules/auth/services';
import { useI18n } from '@/providers';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordForm() {
	const { t } = useI18n();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [errorDialogOpen, setErrorDialogOpen] = useState(false);
	const [errorDialogMessage, setErrorDialogMessage] = useState('');
	const [successOpen, setSuccessOpen] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		setError(null);
		setErrorDialogOpen(false);

		const normalizedEmail = email.trim();
		if (!normalizedEmail) {
			setError(t('forgotPassword.error.emailRequired'));
			return;
		}

		if (!EMAIL_REGEX.test(normalizedEmail)) {
			setError(t('forgotPassword.error.emailInvalid'));
			return;
		}

		setLoading(true);
		try {
			const message = await requestForgotPassword(normalizedEmail);
			setSuccessMessage(message);
			setSuccessOpen(true);
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : '';
			setErrorDialogMessage(errMessage);
			setErrorDialogOpen(true);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-3">
				<div className="space-y-2 text-center">
					<h2 className="text-xl font-semibold text-zinc-900">{t('forgotPassword.title')}</h2>
					<p className="text-sm text-zinc-600">{t('forgotPassword.subtitle')}</p>
				</div>
			</div>

			<div className="space-y-2">
				<Input
					id="email"
					type="email"
					value={email}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
					placeholder={t('forgotPassword.form.emailPlaceholder')}
				/>
				{error && (
					<p role="alert" className="text-sm text-red-600">
						{error}
					</p>
				)}
			</div>

			<div className="space-y-3">
				<Button type="submit" className="w-full" disabled={loading}>
					{t('forgotPassword.form.submit')}
				</Button>
				<Link
					href="/auth/login"
					className="block w-full cursor-pointer text-center text-sm font-medium text-red-600 transition-colors hover:text-red-500">
					{t('forgotPassword.form.backToLogin')}
				</Link>
			</div>

			{loading && <LoadingDialog isOpen={loading} label={t('forgotPassword.loading')} />}
			<ErrorDialog
				isOpen={errorDialogOpen}
				onClose={() => setErrorDialogOpen(false)}
				message={errorDialogMessage}
			/>
			<SuccessDialog
				isOpen={successOpen}
				onClose={() => setSuccessOpen(false)}
				message={successMessage}
			/>
		</form>
	);
}
