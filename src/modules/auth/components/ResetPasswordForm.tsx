'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Button,
	Input,
	LoadingDialog,
	ErrorDialog,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	SubTitle,
	Title,
} from '@/shared/components';
import { requestResetPassword } from '@/modules/auth/services';
import { useI18n } from '@/providers';

export default function ResetPasswordForm() {
	const { t } = useI18n();
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token') ?? '';

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
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

		if (!password || !confirmPassword) {
			setError(t('resetPassword.error.required'));
			return;
		}

		setLoading(true);
		try {
			const message = await requestResetPassword(token, password, confirmPassword);
			setSuccessMessage(t(message));
			setSuccessOpen(true);
		} catch (err: unknown) {
			const errMessage = err instanceof Error ? err.message : '';
			const translated = errMessage ? t(errMessage) : '';
			setErrorDialogMessage(
				translated && translated !== errMessage
					? translated
					: errMessage || t('resetPassword.error.requestFailed'),
			);
			setErrorDialogOpen(true);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2 text-center">
				<Title
					title={t('resetPassword.title')}
					className="justify-center [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900"
				/>
				<SubTitle
					name={t('resetPassword.subtitle')}
					className="justify-center [&_h3]:text-sm [&_h3]:font-normal [&_h3]:text-zinc-600"
				/>
			</div>

			<div className="space-y-3">
				<Input
					id="password"
					type="password"
					value={password}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
					placeholder={t('resetPassword.form.passwordPlaceholder')}
				/>
				<Input
					id="confirmPassword"
					type="password"
					value={confirmPassword}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
					placeholder={t('resetPassword.form.confirmPasswordPlaceholder')}
				/>
				{error && (
					<p role="alert" className="text-sm text-red-600">
						{error}
					</p>
				)}
			</div>

			<div className="space-y-3">
				<Button type="submit" className="w-full" disabled={loading}>
					{t('resetPassword.form.submit')}
				</Button>
			</div>

			{loading && <LoadingDialog isOpen={loading} label={t('resetPassword.loading')} />}
			<ErrorDialog
				isOpen={errorDialogOpen}
				onClose={() => setErrorDialogOpen(false)}
				message={errorDialogMessage}
			/>

			<Dialog open={successOpen} onOpenChange={setSuccessOpen}>
				<DialogContent showCloseButton={false} className="max-w-sm">
					<div className="space-y-4">
						<DialogHeader className="items-center">
							<DialogTitle>{t('resetPassword.success.title')}</DialogTitle>
						</DialogHeader>
						<p className="text-center text-sm text-zinc-600">{successMessage}</p>
						<Button type="button" className="w-full" onClick={() => router.push('/auth/login')}>
							{t('resetPassword.success.goToLogin')}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</form>
	);
}
