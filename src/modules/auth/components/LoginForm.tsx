'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import { Input, Button, Checkbox, LoadingDialog, ErrorDialog, Title } from '@/shared/components';
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
	const [rememberMe, setRememberMe] = useState(false);
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
			<div className="space-y-2 text-center">
				<Title
					title={t('login.title')}
					className="justify-center [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900"
				/>
			</div>

			<div className="space-y-2">
				{error && (
					<div role="alert" className="text-sm text-red-600">
						{t(error)}
					</div>
				)}

				<div>
					<Input
						id="email"
						label={t('login.user.label')}
						value={email}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
						placeholder={t('login.user.placeholder')}
						trailingIcon={<UserIcon className="h-5 w-5" />}
					/>
				</div>

				<div>
					<Input
						id="password"
						label={t('login.password.label')}
						type="password"
						value={password}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
						placeholder={t('login.password.placeholder')}
						trailingIcon={<LockClosedIcon className="h-5 w-5" />}
					/>
				</div>
			</div>

			<label htmlFor="remember-me" className="flex items-center gap-2 text-sm">
				<Checkbox
					id="remember-me"
					checked={rememberMe}
					onCheckedChange={(checked) => setRememberMe(checked)}
				/>
				{t('login.remember')}
			</label>

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
				<Link
					href="/auth/forgot-password"
					className="block w-full cursor-pointer text-center text-sm font-medium text-red-600 transition-colors hover:text-red-500">
					{t('login.forgot')}
				</Link>
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
