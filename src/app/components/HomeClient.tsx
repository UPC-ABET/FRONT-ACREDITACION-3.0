'use client';

import React from 'react';
import { useI18n } from '@/providers';

export default function HomeClient() {
	const { t } = useI18n();

	return (
		<div className="space-y-2">
			<h1 className="text-3xl font-bold text-zinc-900 tracking-tight">{t('welcome')}</h1>
		</div>
	);
}
