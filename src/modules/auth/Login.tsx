'use client';

import React, { Suspense } from 'react';
import LoginForm from './components/LoginForm';
import { Card } from '@/shared/components/ui/Card';
import { LanguageSwitcher, Title } from '@/shared/components';
import { useI18n } from '@/providers';
export default function Login() {
	const { t } = useI18n();

	return (
		<div className="relative min-h-screen w-full bg-[image:var(--login-bg)] bg-cover bg-center flex items-center justify-center">
			<div className="absolute right-4 top-4 z-10">
				<LanguageSwitcher />
			</div>
			<div className="w-full px-4 py-8">
				<div className="mx-auto w-full max-w-[360px] sm:max-w-[480px] md:max-w-[540px]">
					<Card className="w-full px-8 py-8 flex flex-col justify-center gap-4 aspect-auto md:aspect-square">
						<div className="text-center">
							<img
								className="mx-auto w-auto mb-3 h-[72px] md:h-[96px]"
								src="/assets/ABETLogo.png"
								alt={t('sidebar.logoAlt')}
							/>

							<div className="flex justify-center">
								<Title title={t('login.title')} className="justify-center py-0" />
							</div>
						</div>

						<Suspense fallback={null}>
							<LoginForm />
						</Suspense>
					</Card>
				</div>
			</div>
		</div>
	);
}
