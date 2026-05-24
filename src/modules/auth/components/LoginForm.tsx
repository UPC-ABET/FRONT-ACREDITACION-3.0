'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Select, Button, LoadingDialog, ErrorDialog } from '@/shared/components';
import { LoginPayload } from '@/shared/types';
import { loginByCredentials, getMicrosoftLoginUrl } from '@/modules/auth/services';
import { setAuthCookies } from '@/shared/lib';
import { schoolOptions } from '@/modules/auth/constants';
import { useI18n } from '@/providers';

export default function LoginForm() {
	const [schoolCode, setSchoolCode] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [dialogMessage, setDialogMessage] = useState('');
	const router = useRouter();
	const { t } = useI18n();

	const localizedSchools = useMemo(
		() =>
			schoolOptions.map((option) => ({
				value: option.id,
				label: t(option.labelKey),
			})),
		[t],
	);

	const handleSubmit = async (e?: React.FormEvent) => {
		e?.preventDefault();
		setError(null);
		setDialogOpen(false);

		if (!schoolCode || !email || !password) {
			setError(t('login.error.required'));
			return;
		}

		const payload: LoginPayload = { school_code: schoolCode, email, password };
		setLoading(true);
		try {
			const res = await loginByCredentials(payload);
			setAuthCookies(res.user, schoolCode, res.expiresIn);
			router.replace('/');
		} catch (err: any) {
			const rawMessage = typeof err?.message === 'string' ? err.message : '';
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
		if (!schoolCode) {
			setError(t('login.error.schoolRequired'));
			return;
		}
		window.location.assign(getMicrosoftLoginUrl(schoolCode));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="space-y-2">
				{error && (
					<div role="alert" className="text-sm text-red-600">
						{error}
					</div>
				)}

				<div>
					<Select
						name="escuela"
						value={localizedSchools.find((s) => s.value === schoolCode) || null}
						onChange={(_, v) => setSchoolCode((v as any)?.value || '')}
						options={localizedSchools}
						placeholder={t('login.school.placeholder')}
					/>
				</div>

				<div>
					<Input
						id="email"
						value={email}
						onChange={(e: any) => setEmail(e.target.value)}
						placeholder={t('login.user.placeholder')}
					/>
				</div>

				<div>
					<Input
						id="password"
						type="password"
						value={password}
						onChange={(e: any) => setPassword(e.target.value)}
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
						className="text-sm text-red-600 hover:text-red-500 transition-colors">
						{t('login.forgot')}
					</button>
				</div>
			</div>

			{loading && <LoadingDialog isOpen={loading} label={t('login.loading')} />}
			<ErrorDialog
				isOpen={dialogOpen}
				onClose={() => setDialogOpen(false)}
				message={dialogMessage}
			/>
		</form>
	);
}
