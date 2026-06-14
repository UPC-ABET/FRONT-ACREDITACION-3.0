'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input, Button, LoadingDialog, ErrorDialog } from '@/shared/components';
import type { LoginPayload } from '@/modules/auth/types';
import { loginByCredentials, getMicrosoftLoginUrl } from '@/modules/auth/services';
import { safeRedirect } from '@/shared/lib';
import { useAuth, useI18n } from '@/providers';

const MICROSOFT_ERROR_CODES = ['USER_NOT_FOUND', 'NO_ROLE', 'LOGIN_FAILED'] as const;

function microsoftErrorKey(code: string | null): string | null {
	if (!code) return null;
	return (MICROSOFT_ERROR_CODES as readonly string[]).includes(code)
		? `login.error.${code}`
		: 'login.error.generic';
}

export default function LoginForm() {
	const searchParams = useSearchParams();
	const initialMicrosoftErrorKey = microsoftErrorKey(searchParams.get('error'));
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(initialMicrosoftErrorKey != null);
	const [dialogMessage, setDialogMessage] = useState(initialMicrosoftErrorKey ?? '');
	const router = useRouter();
	const { t } = useI18n();
	const { refreshUser } = useAuth();

	useEffect(() => {
		if (!initialMicrosoftErrorKey) return;
		window.history.replaceState(null, '', '/auth/login');
		// eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; the error code is already captured in state
	}, []);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		setError(null);
		setDialogOpen(false);

		if (!email || !password) {
			setError('login.error.required');
			return;
		}

		const payload: LoginPayload = { email, password };
		setLoading(true);
		try {
			await loginByCredentials(payload);
			const refreshedUser = await refreshUser({ showGlobalLoading: false });
			if (!refreshedUser) {
				throw new Error('error.auth.noPermissionsConfigured');
			}
			router.replace('/');
		} catch (err: unknown) {
			const rawMessage = err instanceof Error ? err.message : '';
			const translated = rawMessage ? t(rawMessage) : '';
			const resolvedMessage =
				translated && translated !== rawMessage
					? translated
					: rawMessage || t('login.error.generic');
			setDialogMessage(resolvedMessage);
			setDialogOpen(true);
		} finally {
			setLoading(false);
		}
	};

	const handleMicrosoftLogin = () => {
		safeRedirect(getMicrosoftLoginUrl(), 'assign');
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				{error && (
					<div role="alert" className="text-sm text-red-600">
						{t(error)}
					</div>
				)}

				<div>
					<Input
						id="email"
						value={email}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
						placeholder={t('login.user.placeholder')}
					/>
				</div>

				<div>
					<Input
						id="password"
						type="password"
						value={password}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
						placeholder={t('login.password.placeholder')}
					/>
				</div>
			</div>

			<div className="flex items-center">
				<label htmlFor="remember-me" className="flex items-center text-sm">
					<input id="remember-me" type="checkbox" className="mr-2" /> {t('login.remember')}
				</label>
			</div>

			<div className="space-y-3">
				<Button type="submit" className="w-full">
					{t('login.submit')}
				</Button>
				<Button
					type="button"
					className="w-full flex items-center justify-center gap-2"
					onClick={handleMicrosoftLogin}>
					<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
						<rect x="1" y="1" width="7" height="7" fill="#F25022" />
						<rect x="10" y="1" width="7" height="7" fill="#7FBA00" />
						<rect x="1" y="10" width="7" height="7" fill="#00A4EF" />
						<rect x="10" y="10" width="7" height="7" fill="#FFB900" />
					</svg>
					{t('login.microsoft')}
				</Button>
				<div className="text-center">
					<button
						type="button"
						onClick={() => router.push('/auth/forgot-password')}
						className="inline-flex cursor-pointer items-center justify-center text-sm font-medium text-red-600 transition-colors hover:text-red-500">
						{t('login.forgot')}
					</button>
				</div>
			</div>

			{loading && <LoadingDialog isOpen={loading} label={t('login.loading')} />}
			<ErrorDialog
				isOpen={dialogOpen}
				onClose={() => setDialogOpen(false)}
				message={dialogMessage ? t(dialogMessage) : dialogMessage}
			/>
		</form>
	);
}
