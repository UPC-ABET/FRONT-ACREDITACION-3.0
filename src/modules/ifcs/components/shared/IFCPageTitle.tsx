'use client';

import { useI18n } from '@/providers';
import type { I18nText } from '../../types';

type Props = {
	area: I18nText;
	subarea: I18nText;
	course: I18nText;
	period: string;
};

export function IFCPageTitle({ area, subarea, course, period }: Props) {
	const { locale: lang } = useI18n();
	const courseName = course?.[lang] ?? '';
	const crumbs = [area?.[lang] ?? '', subarea?.[lang] ?? '', period].filter(Boolean);

	return (
		<div className="space-y-1.5">
			<p className="text-sm font-semibold uppercase tracking-wider text-red-700">IFC</p>
			<h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
				{courseName || '—'}
			</h1>
			{crumbs.length > 0 && <p className="text-base text-zinc-600">{crumbs.join(' · ')}</p>}
		</div>
	);
}
