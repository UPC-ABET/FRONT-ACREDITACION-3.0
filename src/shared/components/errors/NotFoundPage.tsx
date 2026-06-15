'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, SubTitle, Title } from '@/shared/components';
import { useAuth, useI18n } from '@/providers';

function NotFoundPage() {
	const router = useRouter();
	const { t } = useI18n();
	const { isAuthenticated } = useAuth();

	useEffect(() => {
		document.body.classList.add('not-found');
		return () => document.body.classList.remove('not-found');
	}, []);

	const handleGoHome = () => {
		if (isAuthenticated) {
			router.push('/');
		} else {
			router.push('/auth/login');
		}
	};

	return (
		<main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
			<div className="text-center">
				<p className="text-base font-semibold text-red-600">404</p>
				<Title
					title={t('notFound.title')}
					className="mt-4 justify-center [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-zinc-900 sm:[&_h2]:text-5xl"
				/>
				<SubTitle
					name={t('notFound.message')}
					className="mt-6 justify-center [&_h3]:text-base [&_h3]:font-normal [&_h3]:leading-7 [&_h3]:text-zinc-600"
				/>
				<div className="mt-10 flex items-center justify-center gap-x-6">
					<Button type="button" onClick={handleGoHome}>
						{t('notFound.action')}
					</Button>
				</div>
			</div>
		</main>
	);
}

export { NotFoundPage };
