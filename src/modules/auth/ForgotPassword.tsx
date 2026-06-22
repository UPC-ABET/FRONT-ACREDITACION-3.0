'use client';

import Image from 'next/image';
import { Card } from '@/shared/components/ui/Card';
import { useI18n } from '@/providers';
import ForgotPasswordForm from './components/ForgotPasswordForm';

export default function ForgotPassword() {
	const { t } = useI18n();

	return (
		<div className="min-h-screen w-full bg-[image:var(--login-bg)] bg-cover bg-center flex items-center justify-center">
			<div className="w-full px-4 py-8">
				<div className="mx-auto w-full max-w-[360px] sm:max-w-[480px] md:max-w-[540px]">
					<Card className="w-full px-8 py-8 flex flex-col justify-center gap-5 aspect-auto md:aspect-square">
						<div className="text-center">
							<Image
								className="mx-auto w-auto mb-3 h-[72px] md:h-[96px]"
								src="/assets/ABETLogo.png"
								alt={t('sidebar.logoAlt')}
								width={515}
								height={484}
								priority
							/>
						</div>
						<ForgotPasswordForm />
					</Card>
				</div>
			</div>
		</div>
	);
}
