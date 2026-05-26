'use client';

import React from 'react';
import { Card } from '@/shared/components/ui/Card';
import { useI18n } from '@/providers';
import { LOGIN_BACKGROUND_URL } from '@/modules/auth/constants';
import ForgotPasswordForm from './components/ForgotPasswordForm';

export default function ForgotPassword() {
	const { t } = useI18n();

	return (
		<div
			className="min-h-screen w-full bg-cover bg-center flex items-center justify-center"
			style={{ backgroundImage: `url(${LOGIN_BACKGROUND_URL})` }}>
			<div className="w-full px-4 py-8">
				<div className="mx-auto w-full max-w-[360px] sm:max-w-[480px] md:max-w-[540px]">
					<Card className="w-full px-8 py-8 flex flex-col justify-center gap-5 aspect-auto md:aspect-square">
						<div className="text-center">
							<img
								className="mx-auto w-auto mb-3 h-[72px] md:h-[96px]"
								src="/assets/ABETLogo.png"
								alt={t('sidebar.logoAlt')}
							/>
						</div>
						<ForgotPasswordForm />
					</Card>
				</div>
			</div>
		</div>
	);
}
