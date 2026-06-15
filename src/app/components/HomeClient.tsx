'use client';

import React from 'react';
import { useI18n } from '@/providers';
import { SubTitle, Title } from '@/shared/components';

export default function HomeClient() {
	const { t } = useI18n();

	return (
		<div className="space-y-1">
			<Title
				title={t('welcome')}
				className="[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:tracking-tight"
			/>
			<SubTitle
				name={t('home.subtitle')}
				className="[&_h3]:text-base [&_h3]:font-medium [&_h3]:text-zinc-500"
			/>
		</div>
	);
}
